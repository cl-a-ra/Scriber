import express, { type ErrorRequestHandler } from 'express';
import { ApiError } from './apiError';
import { createApiRouter, type ApiRouterOptions } from './apiRouter';

export function createApiApp(options: ApiRouterOptions = {}) {
  const app = express();
  app.disable('x-powered-by');
  const proxyHops = process.env.TRUST_PROXY_HOPS;
  if (proxyHops !== undefined) {
    if (!/^[0-5]$/.test(proxyHops)) throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5.');
    app.set('trust proxy', Number(proxyHops));
  }
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/api', express.json({ limit: '32kb' }), createApiRouter(options));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.', code: 'NOT_FOUND' }));
  const handleError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof ApiError) {
      if (error.status >= 500) console.error('API request failed', { code: error.code, status: error.status });
      res.status(error.status).json({ error: error.message, code: error.code });
      return;
    }
    if (error && typeof error === 'object' && 'type' in error) {
      if (error.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'The request body is not valid JSON.', code: 'INVALID_JSON' });
        return;
      }
      if (error.type === 'entity.too.large') {
        res.status(413).json({ error: 'The request body is too large.', code: 'PAYLOAD_TOO_LARGE' });
        return;
      }
    }
    console.error('Unexpected API error', { name: error instanceof Error ? error.name : typeof error });
    res.status(500).json({ error: 'The server could not complete this request.', code: 'INTERNAL_ERROR' });
  };
  app.use(handleError);
  return app;
}
