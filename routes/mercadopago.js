// routes/mercadopago.js
const express = require("express");
const router = express.Router();
const Suscripcion = require("../models/suscripciones");
const mercadopago = require("mercadopago");
require("dotenv").config();

// ✅ Configurar MercadoPago con token de producción
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

// 📌 Crear preferencia de pago
router.post("/crear-preferencia", async (req, res) => {
  try {
    const { userId, planId, planNombre, precioUSD } = req.body;

    if (!userId || !planId || !planNombre || !precioUSD) {
      return res.status(400).json({ error: "Faltan datos para crear la preferencia" });
    }

    const preference = {
      items: [
        {
          title: `Suscripción: ${planNombre}`,
          unit_price: parseFloat(precioUSD),
          quantity: 1,
          currency_id: "USD",
        },
      ],
      back_urls: {
        success: `${process.env.BASE_URL}/planes?status=success&plan=${planNombre}`,
        failure: `${process.env.BASE_URL}/planes?status=failure`,
        pending: `${process.env.BASE_URL}/planes?status=pending`,
      },
      auto_return: "approved",
      metadata: { userId, planId, planNombre },
    };

    const result = await mercadopago.preferences.create(preference);

    // ✅ Guardar suscripción en la base de datos
    await new Suscripcion({
      metodoPago: "MercadoPago",
      preferenceId: result.body.id,
      planId,
      planNombre,
      userId,
      estado: "pendiente",
      fechaInicio: new Date(),
    }).save();

    res.json({ init_point: result.body.init_point });
  } catch (error) {
    console.error("❌ Error al crear preferencia MercadoPago:", error);
    res.status(500).json({ error: "Error al crear preferencia MercadoPago" });
  }
});

// 📩 Webhook de MercadoPago
router.post("/webhook", async (req, res) => {
  try {
    const data = req.body;
    console.log("📩 Webhook recibido:", data);

    if (data && data.data && data.type === "payment") {
      const paymentId = data.data.id;
      await Suscripcion.findOneAndUpdate(
        { preferenceId: paymentId },
        { estado: "activo" },
        { new: true }
      );
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error en webhook MercadoPago:", error);
    res.status(500).send("ERROR");
  }
});

module.exports = router;
