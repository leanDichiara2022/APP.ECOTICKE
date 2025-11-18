// middlewares/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  let token;

  // 1️⃣ Token desde query ?token=
  if (req.query && req.query.token) {
    token = req.query.token.trim();
  }

  // 2️⃣ Token desde headers
  if (!token) {
    token =
      req.header("x-auth-token") ||
      req.header("authorization") ||
      null;

    // Si vino como "Bearer xxx"
    if (token && token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "").trim();
    }
  }

  // 3️⃣ Si NO hay token → redirige
  if (!token) {
    return req.accepts("html")
      ? res.redirect("/login.html")
      : res.status(401).json({ msg: "No hay token, autorización denegada" });
  }

  // 4️⃣ Verificamos token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardar usuario en req
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    return next();
  } catch (err) {
    console.error("❌ Error en token:", err.message);

    return req.accepts("html")
      ? res.redirect("/login.html")
      : res.status(401).json({ msg: "Token inválido" });
  }
};
