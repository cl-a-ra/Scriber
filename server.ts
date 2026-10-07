import express from 'express';
import path from 'path';
import 'dotenv/config';
import { createApiApp } from './src/server/app';

const app = createApiApp();
const portText = process.env.PORT || '3010';
if (!/^\d+$/.test(portText) || Number(portText) < 1 || Number(portText) > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
const PORT = Number(portText);

// Serve static frontend in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  console.log(`Scriber server active on port ${PORT}`);
});
server.on('error', (error) => { console.error('Scriber could not start', error); process.exitCode = 1; });
