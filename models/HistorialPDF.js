const mongoose = require("mongoose");

const historialPDFSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombreArchivo: { type: String, required: true },
    fechaCreacion: { type: Date, default: Date.now },
    estado: { type: String, enum: ["Generado", "Enviado", "Descargado"], default: "Generado" }
});

module.exports = mongoose.model("HistorialPDF", historialPDFSchema);
