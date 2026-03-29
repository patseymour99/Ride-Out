import './config/env'; // Validate env vars first
import http from 'http';
import app from './app';
import { initSocketServer } from './socket/socket.server';
import { env } from './config/env';
import { prisma } from './config/database';

async function bootstrap() {
  // Verify DB connection
  await prisma.$connect();
  console.log('Connected to database');

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Ride-Out API running on http://localhost:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await prisma.$disconnect();
    httpServer.close(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
