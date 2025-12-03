const express = require("express");
const router = express.Router();
const Usuario = require("../models/usuarios");
const bcrypt = require("bcryptjs");

// GET listado de usuarios (solo para pruebas)
router.get("/", async (req, res) => {
  try {
    const users = await Usuario.find();
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

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const nuevo = new Usuario({
      nombre,
      email,
      password: hashed,
    });

    await nuevo.save();

    res.json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error registrando usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Login con SESSION
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const coin = await bcrypt.compare(password, usuario.password);
    if (!coin) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // Guardamos sesión
    req.session.user = {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
    };

    res.json({
      message: "Login exitoso",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Verificar sesión
router.get("/session", (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  res.json({ loggedIn: false });
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Sesión cerrada" });
  });
});

module.exports = router;
