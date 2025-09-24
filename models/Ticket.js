const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    ticketId: {
        type: mongoose.Types.ObjectId,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId(),
    },
    cliente: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    detalles: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000, // límite razonable para evitar abuso
    },
    status: {
        type: String,
        enum: ['Enviado', 'Pendiente', 'Cancelado'],
        default: 'Pendiente',
    },
}, {
    timestamps: true, // agrega createdAt y updatedAt
});

// Index para mejorar búsquedas frecuentes
ticketSchema.index({ cliente: 1, status: 1 });

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
