const mongoose = require("mongoose");

const pdfRegistroSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Formato de correo inválido"]
    },
    celular: {
        type: String,
        trim: true,
        match: [/^\+?[0-9]{7,15}$/, "Número de celular inválido"]
    },
    origen: {
        type: String,
        enum: ["manual", "ticket"],
        default: "manual"
    }
}, {
    timestamps: true
});

// Evita duplicar modelo en hot reload
module.exports = mongoose.models.PDFRegistro || mongoose.model("PDFRegistro", pdfRegistroSchema);
