import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { apiRateLimit } from './middleware/rate-limit.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import routes from './routes/index';
import { findOrCreateGoogleUser } from './services/auth.service';

const app = express();

// Security & parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting
app.use('/api', apiRateLimit);

// Google OAuth passport setup
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL ?? '',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? '';
          const avatarUrl = profile.photos?.[0]?.value;
          const result = await findOrCreateGoogleUser(
            profile.id,
            email,
            profile.displayName,
            avatarUrl
          );
          done(null, { ...result.user, tokens: result.tokens });
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

app.use(passport.initialize());

// API routes
app.use('/api/v1', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorMiddleware);

export default app;
