import app from './app.js';

const PORT = process.env.PORT ?? 8000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  throw new Error('Failed to start server', { cause: error });
});
