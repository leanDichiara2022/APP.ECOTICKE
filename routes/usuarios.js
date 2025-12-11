const express = require("express");
const router = express.Router();
const Usuario = require("../models/usuarios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔥 IMPORTANTE: tu server corre sin HTTPS → secure:false y sameSite:lax
const JWT_SECRET =
  process.env.SESSION_SECRET ||
  process.env.JWT_SECRET ||
  "clave_super_segura";

// SIEMPRE false porque tu sitio no usa HTTPS internamente
const COOKIE_SECURE = false; 

// GET listado (pruebas)
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

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    console.log("📥 Login recibido:", { email, passwordOK: !!password, deviceId });

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const usuario = await Usuario.findOne({ email: normalizedEmail });

    if (!usuario) {
      console.log("❌ Usuario no encontrado:", normalizedEmail);
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      console.log("❌ Contraseña incorrecta");
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // Token
    const payload = { id: usuario._id, email: usuario.email, nombre: usuario.nombre };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    // COOKIE compatible con tu servidor actual
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,      // 🔥 obligatorio porque no tenés HTTPS interno
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000,
    });

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

// Sesión
router.get("/session", (req, res) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.header("authorization")) {
      const header = req.header("authorization");
      if (header.startsWith("Bearer ")) {
        token = header.slice(7).trim();
      }
    }

    if (!token) return res.json({ loggedIn: false });

    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ loggedIn: true, user: decoded });
  } catch (err) {
    return res.json({ loggedIn: false });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  res.json({ message: "Sesión cerrada" });
});

module.exports = router;
