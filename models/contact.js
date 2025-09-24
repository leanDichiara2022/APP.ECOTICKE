const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "El email no es válido"],
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+?[0-9]{7,15}$/, "El teléfono debe tener entre 7 y 15 dígitos"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true, // evita que se modifique después de crearlo
    }
}, {
    timestamps: true,
});

// Indexes para búsquedas rápidas
contactSchema.index({ email: 1, phone: 1 });

module.exports = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
