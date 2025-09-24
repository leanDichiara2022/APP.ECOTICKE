const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/usuarios");
const authMiddleware = require("../middlewares/authMiddleware");

// ------------------ REGISTRO ------------------
router.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios." });
  }

  try {
    const existingUser = await Usuario.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // nuevo usuario siempre arranca con plan personal y 1 dispositivo permitido
    const newUser = new Usuario({
      nombre,
      email,
      password: hashedPassword,
      plan: { tipo: "personal", estado: "prueba" },
      allowedDevices: 1
    });

    await newUser.save();
    res.status(201).json({ message: "Usuario registrado con éxito." });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
});

// ------------------ LOGIN ------------------
router.post("/login", async (req, res) => {
  const { email, password, deviceId } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios." });
  }

  try {
    const user = await Usuario.findOne({ email });
    if (!user) return res.status(400).json({ message: "Usuario no encontrado." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta." });

    const deviceIdentifier = deviceId || `${req.ip}-${req.headers["user-agent"]}`;

    // Intentar agregar dispositivo
    const added = user.addDevice(deviceIdentifier);
    if (!added) {
      return res.status(403).json({
        message: `Límite de dispositivos alcanzado. Plan permite ${user.allowedDevices} dispositivos.`
      });
    }

    await user.save();

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, deviceId: deviceIdentifier },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
});

// ------------------ LOGOUT ------------------
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const user = await Usuario.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

    const deviceIdentifier = deviceId || req.user.deviceId;
    user.removeDevice(deviceIdentifier);
    await user.save();

    res.json({ message: "Cierre de sesión exitoso." });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
});

// ------------------ ACTUALIZAR NEGOCIO ------------------
router.put("/negocio", authMiddleware, async (req, res) => {
  try {
    const { nombre, direccion, telefono, logo } = req.body;
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    usuario.negocio = { nombre, direccion, telefono, logo };
    await usuario.save();

    res.json({ message: "Datos del negocio actualizados", negocio: usuario.negocio });
  } catch (error) {
    console.error("Error al actualizar negocio:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
