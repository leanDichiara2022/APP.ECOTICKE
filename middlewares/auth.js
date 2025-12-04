// middlewares/auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || "clave_super_segura";

module.exports = function (req, res, next) {
  let token =
    (req.cookies && req.cookies.token) ||
    req.header("x-auth-token") ||
    req.header("authorization") ||
    (req.query && req.query.token) ||
    null;

  if (!token) return next();

  if (typeof token === "string" && token.startsWith("Bearer ")) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // Token inválido -> seguimos sin bloquear
    return next();
  }
};
