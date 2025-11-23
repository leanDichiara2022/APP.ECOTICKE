const Usuario = require('../models/usuarios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registro de un nuevo usuario
exports.register = async (req, res) => {
  const { nombre, email, password, plan = 'personal' } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await Usuario.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = new Usuario({
      nombre,
      email: normalizedEmail,
      password: hashedPassword,
      plan,
      devices: []
    });

    await usuario.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente.' });
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error al registrar usuario.' });
  }
};

// Inicio de sesión
exports.login = async (req, res) => {
  const { email, password, deviceId } = req.body;

  if (!email || !password || !deviceId) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios (incluido el ID del dispositivo).' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const usuario = await Usuario.findOne({ email: normalizedEmail });

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    // Validar dispositivos
    const allowedDevices = usuario.plan === 'empresa' ? usuario.allowedDevices || 100 : 1;

    if (!usuario.devices.includes(deviceId) && usuario.devices.length >= allowedDevices) {
      return res.status(403).json({
        message: `Has alcanzado el límite de dispositivos permitidos (${allowedDevices}).`,
      });
    }

    if (!usuario.devices.includes(deviceId)) usuario.devices.push(deviceId);
    await usuario.save();

    // Generar token
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, deviceId },
      process.env.SESSION_SECRET,
      { expiresIn: '8h' }
    );

    // 🔥 COOKIE CORREGIDA 🔥
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,       // Ecoticke usa HTTPS
      sameSite: "none",   // Chrome lo exige si secure = true
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
    });

    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        plan: usuario.plan,
        negocio: usuario.negocio,
        devices: usuario.devices
      }
    });
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
};

// Cerrar sesión
exports.logout = async (req, res) => {
  const token = req.cookies.token;
  const { deviceId } = req.body;

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.SESSION_SECRET);
      const usuario = await Usuario.findById(decoded.id);

      if (usuario && deviceId) {
        usuario.devices = usuario.devices.filter(d => d !== deviceId);
        await usuario.save();
      }
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/"
    });

    res.json({ message: 'Sesión cerrada exitosamente.' });
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    res.status(500).json({ message: 'Error al cerrar sesión.' });
  }
};
