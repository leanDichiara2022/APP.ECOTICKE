const mongoose = require('mongoose');

const suscripcionSchema = new mongoose.Schema({
  paypalOrderId: { type: String, required: true },
  status: { type: String, default: 'COMPLETADO' },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Suscripcion', suscripcionSchema);
