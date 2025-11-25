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

// Login
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

    res.json({ message: "Login exitoso" });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
