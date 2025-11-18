// middlewares/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  let token =
    req.header("x-auth-token") ||
    req.header("authorization") ||
    req.query.token;

  if (!token) {
    if (req.accepts("html")) {
      return res.redirect("/login.html");
    } else {
      return res
        .status(401)
        .json({ msg: "No hay token, autorización denegada" });
    }
  }

  // Si viene con "Bearer XXX"
  if (token.startsWith("Bearer ")) {
    token = token.replace("Bearer ", "").trim();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 CORRECCIÓN IMPORTANTE:
    // Guardamos lo que REALMENTE contiene el token
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (err) {
    if (req.accepts("html")) {
      return res.redirect("/login.html");
    } else {
      return res.status(401).json({ msg: "Token inválido" });
    }
  }
};
