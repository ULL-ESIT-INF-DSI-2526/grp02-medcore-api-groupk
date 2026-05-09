import express from 'express';

export const defaultRouter = express.Router();

/**
 * Router por defecto que captura rutas no definidas.
 * Devuelve 501 para endpoints inexistentes.
 * Debe registrarse al final de todas las rutas.
 */
defaultRouter.all('/{*splat}', (_, res) => {
  res.status(501).send();
});