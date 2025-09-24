const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Suscripcion = require('../models/suscripcion');
const axios = require('axios');

// POST /confirmar-suscripcion
router.post('/confirmar-suscripcion', async (req, res) => {
  try {
    const { userId, planId, planNombre, estado, fechaInicio, fechaFin } = req.body;

    const nuevaSuscripcion = new Suscripcion({
      userId,
      planId,
      planNombre,
      estado,
      fechaInicio,
      fechaFin,
    });

    await nuevaSuscripcion.save();

    res.status(200).json({ mensaje: 'Suscripción guardada correctamente' });
  } catch (error) {
    console.error('❌ Error al guardar suscripción:', error);
    res.status(500).json({ mensaje: 'Error al guardar suscripción' });
  }
});

// GET /listar-suscripciones
router.get('/listar-suscripciones', async (req, res) => {
  try {
    const suscripciones = await Suscripcion.find().sort({ fechaInicio: -1 });
    res.status(200).json(suscripciones);
  } catch (error) {
    console.error('❌ Error al listar suscripciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener suscripciones' });
  }
});

// GET /cotizacion-dolar
router.get('/cotizacion-dolar', async (req, res) => {
  try {
    const respuesta = await axios.get('https://api.bluelytics.com.ar/v2/latest');
    const valor = respuesta.data?.blue?.value_sell || 1000; // fallback
    res.json({ valor });
  } catch (error) {
    console.error('❌ Error al obtener cotización del dólar:', error);
    res.status(500).json({ mensaje: 'Error al obtener la cotización del dólar' });
  }
});

// DELETE /cancelar-suscripcion/:id
router.delete('/cancelar-suscripcion/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Suscripcion.findByIdAndDelete(id);
    res.status(200).json({ mensaje: 'Suscripción cancelada correctamente' });
  } catch (error) {
    console.error('❌ Error al cancelar la suscripción:', error);
    res.status(500).json({ mensaje: 'Error al cancelar la suscripción' });
  }
});

module.exports = router;
