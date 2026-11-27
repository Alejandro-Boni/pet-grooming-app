// Express 4 no captura los errores de handlers async: si una consulta a la BD falla,
// la petición queda colgada y (en Node 18+) el rechazo sin manejar puede tumbar el proceso.
// Este router envuelve cada handler para reenviar el error a app.use((err, req, res, next))
// de index.js, que responde 500. Sin dependencias extra.
const express = require('express');

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function wrap(handler) {
  // Los handlers de error de Express tienen 4 argumentos: se dejan intactos.
  if (typeof handler !== 'function' || handler.length === 4) return handler;
  return (req, res, next) => {
    try {
      Promise.resolve(handler(req, res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
}

function asyncRouter() {
  const router = express.Router();
  for (const method of METHODS) {
    const original = router[method].bind(router);
    router[method] = (path, ...handlers) => original(path, ...handlers.map(wrap));
  }
  return router;
}

module.exports = { asyncRouter };
