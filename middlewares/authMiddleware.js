// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuarios");

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    const deviceId = req.header("x-device-id"); // se envía desde el frontend

    console.log("🔍 Token recibido en Authorization:", token);
    console.log("🔍 DeviceId recibido:", deviceId);

    if (!token) {
      return res.status(401).json({ error: "No se proporcionó un token en Authorization" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "No se proporcionó el deviceId en la cabecera" });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    // ✅ Usar la misma clave secreta que en login
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);

    if (!usuario) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // ✅ Verificar que el deviceId esté en la lista "devices"
    const activeDevice = usuario.devices.find(d => d.deviceId === deviceId);
    if (!activeDevice) {
      return res.status(403).json({ 
        error: "Este dispositivo no está autorizado para este usuario" 
      });
    }

    // Actualizar fecha de último uso del dispositivo
    activeDevice.lastUsed = new Date();
    await usuario.save();

    // Guardar datos del usuario en req
    req.user = {
      id: usuario._id,
      email: usuario.email,
      plan: usuario.plan,
      deviceId
    };

    next();
  } catch (error) {
    console.error("❌ Error en authMiddleware:", error.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

module.exports = authMiddleware;
