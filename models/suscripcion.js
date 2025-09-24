const mongoose = require('mongoose');

const suscripcionSchema = new mongoose.Schema({
  userId: String,
  planId: String,
  planNombre: String,
  estado: String,
  fechaInicio: Date,
  fechaFin: Date
});

// Evitar el OverwriteModelError si el modelo ya está definido
module.exports = mongoose.models.Suscripcion || mongoose.model('Suscripcion', suscripcionSchema);
