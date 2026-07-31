import express, { type Application } from 'express';
import { httpLogger } from './middlewares/logger.js';

const app: Application = express();

app.use(httpLogger);
app.use(express.json());

app.get('/health', (_req, res) => {
  res
    .status(200)
    .json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

export default app;
