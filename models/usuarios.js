const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
  }
}, {
  timestamps: true
});

// Comparar contraseña
UsuarioSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const Usuario = mongoose.model("Usuario", UsuarioSchema);
module.exports = Usuario;
