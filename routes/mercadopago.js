// routes/mercadopago.js
const express = require('express');
const router = express.Router();
const Suscripcion = require('../models/suscripcion');
require('dotenv').config();
const mercadopago = require('mercadopago');

// Configurar MercadoPago con token de producción
mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

// Crear preferencia de pago
router.post('/crear-preferencia', async (req, res) => {
  try {
    const { userId, planId, planNombre, precioUSD } = req.body;

    if (!userId || !planId || !planNombre || !precioUSD) {
      return res.status(400).json({ error: 'Faltan datos para crear la preferencia' });
    }

    const preferenceData = {
      items: [
        {
          title: `Suscripción: ${planNombre}`,
          unit_price: parseFloat(precioUSD),
          quantity: 1,
          currency_id: 'USD'
        }
      ],
      back_urls: {
        success: `${process.env.BASE_URL}/mercadopago/pago-exitoso`,
        failure: `${process.env.BASE_URL}/mercadopago/pago-fallido`,
        pending: `${process.env.BASE_URL}/mercadopago/pago-pendiente`
      },
      auto_return: 'approved',
      metadata: {
        userId,
        planId,
        planNombre
      }
    };

    const preference = await mercadopago.preferences.create(preferenceData);
    res.json({ id: preference.body.id, init_point: preference.body.init_point });
  } catch (error) {
    console.error('❌ Error al crear preferencia MercadoPago:', error);
    res.status(500).json({ error: 'Error al crear preferencia MercadoPago' });
  }
});

// Webhook de MercadoPago
router.post('/webhook', async (req, res) => {
  try {
    const data = req.body;
    console.log('📩 Webhook recibido de MercadoPago:', data);

    // Aquí actualizar la suscripción según data.type y data.id
    // data.id es el id de la preferencia o payment
    // Ejemplo:
    // const suscripcion = await Suscripcion.findOne({ preferenceId: data.id });
    // if (suscripcion) { suscripcion.estado = 'activo'; await suscripcion.save(); }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error en webhook MercadoPago:', error);
    res.status(500).send('ERROR');
  }
});

// Listar suscripciones (opcional)
router.get('/listar-suscripciones', async (req, res) => {
  try {
    const suscripciones = await Suscripcion.find().sort({ fechaInicio: -1 });
    res.status(200).json(suscripciones);
  } catch (error) {
    console.error('❌ Error al listar suscripciones:', error);
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
});

module.exports = router;
