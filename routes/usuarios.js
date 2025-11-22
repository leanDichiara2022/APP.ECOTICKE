// routes/usuarios.js
const express = require("express");
const Usuario = require("../models/usuarios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const router = express.Router();

// ------------------ REGISTRO DE USUARIO ------------------
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password, deviceId } = req.body;

    if (!nombre || !email || !password) {
      logger.warn("Intento de registro incompleto", { email });
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    const emailLower = email.toLowerCase();

    const existingUser = await Usuario.findOne({ email: emailLower });
    if (existingUser) {
      logger.warn("Registro fallido: correo ya registrado", { email: emailLower });
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Usuario({
      nombre,
      email: emailLower,
      password: hashedPassword,
      plan: { tipo: "personal", estado: "prueba" },
      // allowedDevices por defecto lo maneja el modelo
      devices: []
    });

    if (deviceId) {
      newUser.devices.push({ deviceId, lastUsed: new Date() });
    }

    await newUser.save();

    logger.info("Usuario registrado con éxito", { userId: newUser._id, email: emailLower });
    res.status(201).json({ message: "Usuario registrado con éxito." });
  } catch (error) {
    logger.error("Error en el registro de usuario", { error: error.message });
    res.status(500).json({ message: "Error en el servidor." });
  }
});

// ------------------ INICIO DE SESIÓN ------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
      logger.warn("Intento de login con campos incompletos", { email, deviceId });
      return res.status(400).json({ message: "Email y contraseña son obligatorios." });
    }

    const emailLower = email.toLowerCase();
    const user = await Usuario.findOne({ email: emailLower });

    if (!user) {
      logger.warn("Login fallido: usuario no encontrado", { email: emailLower });
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn("Login fallido: contraseña incorrecta", { userId: user._id });
      return res.status(401).json({ message: "Contraseña incorrecta." });
    }

    // --- Cambiado: ya NO bloqueamos por límite de dispositivos ---
    // Si deviceId llega, actualizamos/insertamos en user.devices sin negar el acceso.
    if (deviceId) {
      const existingDevice = user.devices.find(d => d.deviceId === deviceId);
      if (!existingDevice) {
        user.devices.push({ deviceId, lastUsed: new Date() });
      } else {
        existingDevice.lastUsed = new Date();
      }
    }

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();

    logger.info("Inicio de sesión exitoso", { userId: user._id, deviceId });
    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error("Error en el inicio de sesión", { error: error.message });
    res.status(500).json({ message: "Error en el servidor." });
  }
});

// ------------------ CIERRE DE SESIÓN ------------------
router.post("/logout", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const deviceId = req.header("x-device-id");

    if (!token || !deviceId) {
      return res.status(400).json({ message: "Token y deviceId son obligatorios." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Usuario.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado." });
    }

    // ⚡ eliminar SOLO ese deviceId sin romper otros dispositivos
    user.devices = user.devices.filter(d => d.deviceId !== deviceId);

    await user.save();

    logger.info("Cierre de sesión exitoso", {
      userId: user._id,
      email: user.email,
      deviceId
    });

    res.json({ message: "Cierre de sesión exitoso." });
  } catch (error) {
    logger.error("Error en logout", { error: error.message });
    res.status(500).json({ message: "Error en el servidor." });
  }
});

// ------------------ BÚSQUEDA POR EMAIL O CELULAR ------------------
router.get("/search", async (req, res) => {
  const q = req.query.q;

  if (!q) {
    logger.warn("Intento de búsqueda sin query");
    return res.status(400).json({ message: "Debe proporcionar un email o número de celular para buscar." });
  }

  try {
    const usuario = await Usuario.findOne({
      $or: [{ email: q.toLowerCase() }, { "negocio.telefono": q }]
    }).select("-password");

    if (!usuario) {
      logger.info("Búsqueda de usuario: no encontrado", { query: q });
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    logger.info("Búsqueda de usuario exitosa", { userId: usuario._id, query: q });
    res.json(usuario);
  } catch (err) {
    logger.error("Error al buscar usuario", { error: err.message });
    res.status(500).json({ message: "Error en el servidor." });
  }
});

module.exports = router;
