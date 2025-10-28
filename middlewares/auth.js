const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const token = req.header("x-auth-token");
    if (!token) {
        // Si la petición viene del navegador (HTML), redirigimos al login
        if (req.accepts("html")) {
            return res.redirect("/login.html");
        } else {
            return res.status(401).json({ msg: "No hay token, autorización denegada" });
        }
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
