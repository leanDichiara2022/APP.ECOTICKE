const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Esquema de usuario
const UsuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    negocio: {
        nombre: { type: String, default: "" },
        direccion: { type: String, default: "" },
        telefono: { type: String, default: "" },
        logo: { type: String, default: "" }
    },
    plan: {
        tipo: {
            type: String,
            enum: ["personal", "empresa"],
            default: "personal"
        },
        inicio: { type: Date, default: Date.now },
        estado: {
            type: String,
            enum: ["activo", "inactivo", "prueba"],
            default: "prueba"
        }
    },
    allowedDevices: {
        type: Number,
        default: 1 // Personal: 1 dispositivo; Empresa: se define según plan
    },
    devices: [
        {
            deviceId: { type: String },
            lastUsed: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true
});

// Comparar contraseña
UsuarioSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Agregar dispositivo
UsuarioSchema.methods.addDevice = function (deviceId) {
    const existingDevice = this.devices.find(d => d.deviceId === deviceId);
    const maxDevices = this.allowedDevices;

    if (!existingDevice) {
        if (this.devices.length >= maxDevices) return false;
        this.devices.push({ deviceId, lastUsed: new Date() });
    } else {
        existingDevice.lastUsed = new Date();
    }
    return true;
};

// Remover dispositivo
UsuarioSchema.methods.removeDevice = function (deviceId) {
    this.devices = this.devices.filter(d => d.deviceId !== deviceId);
};

const Usuario = mongoose.model("Usuario", UsuarioSchema);
module.exports = Usuario;
