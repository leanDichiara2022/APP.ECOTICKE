// routes/usuarios.js
const express = require("express");
const router = express.Router();
const Usuario = require("../models/usuarios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper: obtener secret y secure desde env
const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || "clave_super_segura";
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true"; // setear en .env según HTTPS

// GET listado de usuarios (solo para pruebas)
router.get("/", async (req, res) => {
  try {
    const users = await Usuario.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo usuarios" });
  }
});

// Registro
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existe = await Usuario.findOne({ email: normalizedEmail });
    if (existe) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const nuevo = new Usuario({
      nombre,
      email: normalizedEmail,
      password: hashed,
    });

    await nuevo.save();

    res.status(201).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error registrando usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Login -> genera JWT y cookie
router.post("/login", async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const usuario = await Usuario.findOne({ email: normalizedEmail });
    if (!usuario) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // Generar token con payload mínimo
    const payload = { id: usuario._id, email: usuario.email, nombre: usuario.nombre };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    // Mandar cookie - asegurar sameSite/secure correctos
    res.cookie("token", token, {
      httpOnly: true,
      secure: COOKIE_SECURE,          // true en producción con HTTPS, false para pruebas locales HTTP
      sameSite: COOKIE_SECURE ? "none" : "lax", // si secure=true necesita none
      path: "/",
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
    });

    // También devolver user y token en body por si frontend lo quiere usar (opcional)
    res.json({
      message: "Login exitoso",
      user: { id: usuario._id, nombre: usuario.nombre, email: usuario.email },
      token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Verificar sesión: lee cookie token o header Authorization
router.get("/session", (req, res) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    if (!token && req.header("authorization")) {
      const header = req.header("authorization");
      if (header.startsWith("Bearer ")) token = header.slice(7).trim();
    }

    if (!token) return res.json({ loggedIn: false });

    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ loggedIn: true, user: decoded });
  } catch (err) {
    return res.json({ loggedIn: false });
  }
});

// Logout -> borra cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Sesión cerrada" });
});

module.exports = router;
