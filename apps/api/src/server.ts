import { createApp } from './app.js';
import { readPort } from './platform/config/port.js';

const port = readPort(process.env.PORT, 3000);
const app = createApp();

const server = app.listen(port, '127.0.0.1', () => {
  console.info(`DevPath API escuchando en http://127.0.0.1:${port}`);
});

function shutdown(signal: string) {
  console.info(`DevPath API recibió ${signal}; cerrando servidor.`);
  server.close((error) => {
    if (error !== undefined) {
      console.error('No fue posible cerrar DevPath API de forma ordenada.', error);
      process.exitCode = 1;
      return;
    }

    process.exitCode = 0;
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
