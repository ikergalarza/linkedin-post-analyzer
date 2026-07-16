import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Catch process-level crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
});
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION:', err?.message, err?.stack);
});

import { runMigrations } from './db/migrate';
import creatorsRouter from './routes/creators';
import postsRouter from './routes/posts';
import analysisRouter from './routes/analysis';
import chatRouter from './routes/chat';
import networkRouter from './routes/network';
import discoverRouter from './routes/discover';
import ideasRouter from './routes/ideas';
import accountsRouter from './routes/accounts';
import usageRouter from './routes/usage';
import reactionsRouter from './routes/reactions';
import { startPostMonitor } from './services/postMonitor';
import { basicAuthMiddleware } from './middleware/basicAuth';
import rastroRouter from './routes/rastro';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({ origin: '*' }));
// Body limit lifted from the default (~100kb) so endpoints that accept
// base64-encoded media (e.g. uploaded references for analysis) don't get
// rejected. 16mb keeps us well under typical proxy limits.
app.use(express.json({ limit: '16mb' }));
// El gate de /r/ es un <form> HTML normal, no JSON: sin esto, req.body llega
// vacío y el correo se pierde sin decir nada.
app.use(express.urlencoded({ extended: false }));

// Log every request (before auth so probe attempts are visible in logs)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

// HTTP Basic Auth gate. Mounted BEFORE routes and static files so both the
// API and the frontend index.html require credentials. Activated only when
// APP_BASIC_USER and APP_BASIC_PASS are set in env (Railway). Skips OPTIONS
// preflights and /health endpoints so CORS and uptime checks keep working.
app.use(basicAuthMiddleware());

// Routes
// /r/… va ANTES que nada y fuera del auth: son las páginas públicas del lead
// magnet, las únicas de toda la app que abre gente de fuera.
app.use('/r', rastroRouter);
app.use('/api/creators', creatorsRouter);
app.use('/api/creators', postsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/creators', analysisRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/chat', chatRouter);
app.use('/api/network', networkRouter);
app.use('/api/discover', discoverRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/usage', usageRouter);
app.use('/api/reactions', reactionsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all for unknown API routes
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Express error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[EXPRESS ERROR]', err.message, err.stack);
  res.status(500).json({ error: err.message });
});

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
    startPostMonitor();
  })
  .catch((err) => {
    console.error('Failed to run migrations:', err);
    process.exit(1);
  });

export default app;
