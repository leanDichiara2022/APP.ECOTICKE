const express = require("express");
const Usuario = require("../models/usuarios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const router = express.Router();

// ------------------ REGISTRO DE USUARIO ------------------
router.post("/register", async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        logger.warn("Intento de registro incompleto", { email });
        return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    try {
        const existingUser = await Usuario.findOne({ email });
        if (existingUser) {
            logger.warn("Registro fallido: correo ya registrado", { email });
            return res.status(400).json({ message: "El correo ya está registrado." });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear nuevo usuario con plan por defecto y 1 dispositivo permitido
        const newUser = new Usuario({
            nombre,
            email,
            password: hashedPassword,
            plan: { tipo: "personal", estado: "prueba" },
            allowedDevices: 1,
            activeDevices: []
        });

        await newUser.save();

        logger.info("Usuario registrado con éxito", { userId: newUser._id, email });
        res.status(201).json({ message: "Usuario registrado con éxito." });
    } catch (error) {
        logger.error("Error en el registro de usuario", { error, email });
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// ------------------ INICIO DE SESIÓN ------------------
router.post("/login", async (req, res) => {
    const { email, password, deviceId } = req.body;

    if (!email || !password || !deviceId) {
        logger.warn("Intento de login con campos incompletos", { email, deviceId });
        return res.status(400).json({ message: "Email, contraseña y deviceId son obligatorios." });
    }

    try {
        const user = await Usuario.findOne({ email });
        if (!user) {
            logger.warn("Login fallido: usuario no encontrado", { email });
            return res.status(400).json({ message: "Usuario no encontrado." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn("Login fallido: contraseña incorrecta", { userId: user._id, email });
            return res.status(400).json({ message: "Contraseña incorrecta." });
        }

        // Determinar límite de dispositivos según plan
        const maxDevices = user.allowedDevices || 1;

        // Revisar si el deviceId ya está registrado
        const existingDevice = user.activeDevices.find(d => d.deviceId === deviceId);

        if (!existingDevice) {
            if (user.activeDevices.length >= maxDevices) {
                logger.warn("Límite de dispositivos alcanzado", {
                    userId: user._id,
                    email,
                    deviceId
                });
                return res.status(403).json({
                    message: `Límite de dispositivos alcanzado. Plan permite ${maxDevices} dispositivos.`
                });
            }

            // Registrar nuevo dispositivo
            user.activeDevices.push({ deviceId, lastUsed: new Date() });
        } else {
            // Actualizar fecha de último uso si ya existe
            existingDevice.lastUsed = new Date();
        }

        await user.save();

        // Generar token JWT
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        // Retornar usuario sin password
        const { password: _, ...userWithoutPassword } = user.toObject();

        logger.info("Inicio de sesión exitoso", { userId: user._id, email, deviceId });
        res.status(200).json({
            message: "Inicio de sesión exitoso.",
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        logger.error("Error en el inicio de sesión", { error, email });
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// ------------------ CIERRE DE SESIÓN ------------------
router.post("/logout", async (req, res) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const deviceId = req.header("x-device-id");

    if (!token || !deviceId) {
        return res.status(400).json({ message: "Token y deviceId son obligatorios." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Usuario.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Usuario no encontrado." });
        }

        // Remover el deviceId de la lista activa
        user.activeDevices = user.activeDevices.filter(d => d.deviceId !== deviceId);
        await user.save();

        logger.info("Cierre de sesión exitoso", { userId: user._id, email: user.email, deviceId });
        res.json({ message: "Cierre de sesión exitoso." });
    } catch (error) {
        logger.error("Error en logout", { error });
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
            $or: [{ email: q }, { "negocio.telefono": q }]
        }).select("-password");

        if (!usuario) {
            logger.info("Búsqueda de usuario: no encontrado", { query: q });
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        logger.info("Búsqueda de usuario exitosa", { userId: usuario._id, query: q });
        res.json(usuario);
    } catch (err) {
        logger.error("Error al buscar usuario", { error: err, query: q });
        res.status(500).json({ message: "Error en el servidor." });
    }
});

module.exports = router;
