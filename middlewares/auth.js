// middlewares/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Permitimos pasar sin token para las páginas HTML.
  // Para APIs, si hay token lo validamos, si no hay token dejamos pasar.
  let token =
    req.header("x-auth-token") ||
    req.header("authorization") ||
    (req.query && req.query.token) ||
    null;

  if (!token) {
    // No hay token -> no bloqueamos, simplemente continuamos
    return next();
  }

  // Si viene con "Bearer ..."
  if (typeof token === "string" && token.startsWith("Bearer ")) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET || "clave_super_segura");
    // Guardamos datos mínimos en req.user si vienen
    req.user = decoded;
    return next();
  } catch (err) {
    // Token inválido -> no bloqueamos (esto evita redirecciones inesperadas)
    return next();
  }
};
