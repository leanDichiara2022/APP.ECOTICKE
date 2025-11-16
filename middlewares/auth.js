const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    let token = req.header("x-auth-token") || req.header("authorization");

    if (!token) {
        if (req.accepts("html")) {
            return res.redirect("/login.html");
        } else {
            return res.status(401).json({ msg: "No hay token, autorización denegada" });
        }
    }

    // Si viene con formato "Bearer XXX", lo limpiamos
    if (token.startsWith("Bearer ")) {
        token = token.replace("Bearer ", "").trim();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        if (req.accepts("html")) {
            return res.redirect("/login.html");
        } else {
            return res.status(401).json({ msg: "Token inválido" });
        }
    }
};
