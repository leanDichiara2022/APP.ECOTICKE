const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
        index: true // índice para búsquedas rápidas por ticket
    },
    status: {
        type: String,
        enum: ['Enviado', 'Pendiente', 'Fallido'],
        required: true,
        default: 'Pendiente'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Verifica si ya existe para evitar sobreescrituras en desarrollo
module.exports = mongoose.models.History || mongoose.model('History', historySchema);
