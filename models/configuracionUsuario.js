// models/configuracionUsuario.js
const mongoose = require("mongoose");

const ConfiguracionUsuarioSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true, unique: true },
  nombreNegocio: { type: String, default: "" },
  logo: { type: String, default: "" }, // Ruta del logo si el usuario sube uno
  plantilla: { type: String, default: "factura_simple" }, // Plantilla por defecto
  plantillaPersonalizada: { type: String, default: null }, // Ruta si sube una personalizada
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ConfiguracionUsuario", ConfiguracionUsuarioSchema);
