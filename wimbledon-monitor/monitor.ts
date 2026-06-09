/**
 * Wimbledon Ticket Monitor
 *
 * Loads the Wimbledon ticket resale page every N seconds with a real headless
 * Chromium browser (to get past the site's bot protection), hashes the page
 * content, and pushes an alert to your iPad via ntfy.sh whenever the content
 * changes. Designed to run continuously on an always-on computer.
 *
 * Run with: npm start
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from 'playwright';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config (env vars, with sensible defaults). See .env.example.
// ---------------------------------------------------------------------------
const config = {
  targetUrl: process.env.TARGET_URL ?? 'https://ticketsale.wimbledon.com/content',
  intervalMs: Number(process.env.CHECK_INTERVAL_MS ?? 30_000),
  ntfyServer: (process.env.NTFY_SERVER ?? 'https://ntfy.sh').replace(/\/$/, ''),
  ntfyTopic: process.env.NTFY_TOPIC ?? '',
  // CSS selector to scope the content we diff. 'body' catches everything;
  // narrow this if you get false positives from rotating banners/timestamps.
  contentSelector: process.env.CONTENT_SELECTOR ?? 'body',
  // Realistic browser fingerprint to reduce the chance of a 403 / bot wall.
  userAgent:
    process.env.USER_AGENT ??
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

// Where we persist state so restarts don't trigger a false "change" alert.
const stateDir = join(__dirname, 'state');
const snapshotsDir = join(stateDir, 'snapshots');
const hashFile = join(stateDir, 'last-hash.txt');
const snapshotFile = join(stateDir, 'last-snapshot.txt');

// Send an ntfy warning after this many consecutive failed checks (then again
// every this-many failures), so transient errors stay quiet but real outages
// get surfaced.
const FAILURE_ALERT_THRESHOLD = 5;

let consecutiveFailures = 0;
let shuttingDown = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ts(): string {
  return new Date().toISOString();
}

function log(message: string): void {
  console.log(`[${ts()}] ${message}`);
}

function ensureStateDirs(): void {
  mkdirSync(snapshotsDir, { recursive: true });
}

function readLastHash(): string | null {
  return existsSync(hashFile) ? readFileSync(hashFile, 'utf8').trim() : null;
}

function saveState(hash: string, content: string): void {
  writeFileSync(hashFile, hash, 'utf8');
  writeFileSync(snapshotFile, content, 'utf8');
}

function saveSnapshotCopy(content: string): void {
  const name = `snapshot-${ts().replace(/[:.]/g, '-')}.txt`;
  writeFileSync(join(snapshotsDir, name), content, 'utf8');
}

/** Push a notification to the ntfy topic (shows on the iPad ntfy app). */
async function sendNtfy(opts: {
  title: string;
  body: string;
  priority?: string;
  tags?: string;
}): Promise<void> {
  if (!config.ntfyTopic) {
    log('WARNING: NTFY_TOPIC is not set — skipping push. (See .env.example.)');
    return;
  }
  try {
    const res = await fetch(`${config.ntfyServer}/${config.ntfyTopic}`, {
      method: 'POST',
      headers: {
        Title: opts.title,
        Priority: opts.priority ?? 'high',
        Tags: opts.tags ?? 'tennis',
        Click: config.targetUrl,
      },
      body: opts.body,
    });
    if (!res.ok) {
      log(`WARNING: ntfy push failed with HTTP ${res.status}`);
    }
  } catch (err) {
    log(`WARNING: ntfy push error: ${(err as Error).message}`);
  }
}

/** Normalize text so trivial whitespace differences don't count as changes. */
function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// ---------------------------------------------------------------------------
// Core check
// ---------------------------------------------------------------------------
async function checkOnce(browser: Browser): Promise<void> {
  const context = await browser.newContext({
    userAgent: config.userAgent,
    viewport: { width: 1280, height: 800 },
    locale: 'en-GB',
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(config.targetUrl, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });

    const status = response?.status() ?? 0;
    if (status >= 400) {
      throw new Error(`page returned HTTP ${status}`);
    }

    const raw = await page.locator(config.contentSelector).first().innerText();
    const content = normalize(raw);

    if (!content) {
      throw new Error('extracted content was empty (page may not have loaded)');
    }

    const hash = hashContent(content);
    const previous = readLastHash();

    if (previous === null) {
      saveState(hash, content);
      saveSnapshotCopy(content);
      log(`Baseline recorded (${hash.slice(0, 12)}…). Monitoring for changes.`);
    } else if (hash !== previous) {
      saveState(hash, content);
      saveSnapshotCopy(content);
      log('🎾🚨 PAGE CHANGED — new content detected! Check the site NOW.');
      await sendNtfy({
        title: 'Wimbledon tickets page changed!',
        body: `The page changed at ${ts()}. Tickets may be available — open it now.`,
        priority: 'urgent',
      });
    } else {
      log(`No change (${hash.slice(0, 12)}…).`);
    }

    consecutiveFailures = 0;
  } finally {
    await context.close();
  }
}

async function handleFailure(err: Error): Promise<void> {
  consecutiveFailures += 1;
  log(`Check failed (#${consecutiveFailures}): ${err.message}`);
  if (consecutiveFailures % FAILURE_ALERT_THRESHOLD === 0) {
    await sendNtfy({
      title: 'Wimbledon monitor: repeated errors',
      body: `${consecutiveFailures} consecutive failed checks. Latest: ${err.message}`,
      priority: 'default',
      tags: 'warning',
    });
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  ensureStateDirs();
  log(`Starting Wimbledon monitor.`);
  log(`  Target:   ${config.targetUrl}`);
  log(`  Interval: ${config.intervalMs}ms`);
  log(`  Selector: ${config.contentSelector}`);
  log(`  ntfy:     ${config.ntfyTopic ? `${config.ntfyServer}/${config.ntfyTopic}` : '(not set!)'}`);

  const browser = await chromium.launch({ headless: true });

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log(`Received ${signal}, shutting down…`);
    await browser.close().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // setTimeout-based loop so a slow page load never overlaps the next check.
  const runLoop = async () => {
    while (!shuttingDown) {
      try {
        await checkOnce(browser);
      } catch (err) {
        await handleFailure(err as Error);
      }
      if (shuttingDown) break;
      // Small random jitter (±10%) to look less robotic.
      const jitter = config.intervalMs * 0.1 * (Math.random() * 2 - 1);
      const wait = Math.max(1000, Math.round(config.intervalMs + jitter));
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  };

  await runLoop();
}

main().catch((err) => {
  console.error(`[${ts()}] Fatal error:`, err);
  process.exit(1);
});
