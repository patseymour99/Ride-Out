# Wimbledon Ticket Monitor

Watches the Wimbledon ticket resale page
(`https://ticketsale.wimbledon.com/content`) and **pushes an alert to your
iPad the moment the page changes** — i.e. when new tickets may have become
available.

## How it works

Because an iPad can't run a background monitor (iOS suspends background tabs,
and there's no Node.js / browser automation), the job is split in two:

- **Monitor** — a small Node program that runs on an **always-on computer**
  (a Mac/PC you leave on, or a Raspberry Pi). Every 30 seconds it loads the
  page in a real headless Chromium browser (needed to get past the site's bot
  protection, which blocks plain HTTP requests with a `403`), hashes the
  visible content, and detects any change.
- **Alert** — when the content changes, it sends a push notification via
  [**ntfy.sh**](https://ntfy.sh) (free, no account). You install the **ntfy**
  app on your iPad and subscribe to a topic; the alert pops up with sound.

The first run just records a baseline (no alert). After that, any change to the
page fires a push.

## Setup

### 1. On the always-on computer

Requires [Node.js](https://nodejs.org) v20 or newer.

```bash
cd wimbledon-monitor
npm install          # also downloads the Chromium browser automatically
cp .env.example .env
```

Open `.env` and set **`NTFY_TOPIC`** to a hard-to-guess name, e.g.
`wimbledon-tickets-x7f3a9k2`. Anyone who knows the topic name can see your
alerts, so make it unguessable.

### 2. On your iPad

1. Install the **ntfy** app from the App Store.
2. Tap **+** to subscribe to a topic, and enter the **exact same** topic name
   you put in `.env`.
3. (Optional) Enable notifications/sound for the app in iOS Settings.

### 3. Start monitoring

```bash
npm start
```

Leave the computer on. You'll see a `Baseline recorded…` line on first run,
then `No change…` heartbeats, and a loud alert (plus an iPad push) when the
page changes. Press `Ctrl+C` to stop.

### Keeping it running

To survive logouts/reboots, run it under a process manager instead of a plain
terminal:

```bash
# Option A: pm2
npm install -g pm2
pm2 start "npm start" --name wimbledon-monitor

# Option B: a detached tmux/screen session
tmux new -s wimbledon
npm start            # then detach with Ctrl-b d
```

## Configuration

All settings are environment variables (see `.env.example`):

| Variable            | Default                                    | Purpose                                              |
| ------------------- | ------------------------------------------ | ---------------------------------------------------- |
| `NTFY_TOPIC`        | _(required)_                               | ntfy topic you subscribe to on the iPad              |
| `TARGET_URL`        | `https://ticketsale.wimbledon.com/content` | Page to monitor                                      |
| `CHECK_INTERVAL_MS` | `30000`                                    | How often to check (ms)                              |
| `NTFY_SERVER`       | `https://ntfy.sh`                          | ntfy server                                          |
| `CONTENT_SELECTOR`  | `body`                                     | CSS selector scoping what counts as "the content"    |
| `USER_AGENT`        | _(a Chrome UA)_                            | Browser fingerprint sent to the site                 |

## Tuning false positives

`CONTENT_SELECTOR=body` compares the whole page, so rotating banners, ad
slots, CSRF tokens, or on-page timestamps can trigger alerts even when no
tickets changed. Each detected change is saved under `state/snapshots/` — diff
two snapshots to see what actually moved, then set `CONTENT_SELECTOR` to a
narrower container (e.g. the ticket-listing area) to cut the noise.

## If the site still blocks the browser

The site uses bot protection. Plain Chromium usually loads it, but if you see
repeated `HTTP 403` errors in the logs, the page is challenging the headless
browser. The fix is to add a stealth plugin:

```bash
npm install playwright-extra puppeteer-extra-plugin-stealth
```

…and launch through `playwright-extra` with the stealth plugin. Ask and this
can be wired in.

## State files

Kept in `state/` (git-ignored):

- `last-hash.txt` — hash of the last seen content (so restarts don't false-alarm)
- `last-snapshot.txt` — the last seen content text
- `snapshots/` — a timestamped copy each time a change is detected
