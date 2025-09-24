const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Usuario"
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    deviceInfo: {
        type: String,
        default: "Desconocido"
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "30d" // Expira automáticamente a los 30 días si no se elimina antes
    }
});

module.exports = mongoose.model("Session", sessionSchema);
