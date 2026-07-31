import app from './app.js';
import { env } from './lib/env.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  throw new Error('Failed to start server', { cause: error });
});
