const express = require("express");
const router = express.Router();
const Suscripcion = require("../models/suscripciones");
require("dotenv").config();
const { MercadoPagoConfig, Preference } = require("mercadopago");

// ✅ Inicializar cliente de MercadoPago correctamente
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// 📌 Crear preferencia de pago
router.post("/crear-preferencia", async (req, res) => {
  try {
    const { userId, planId, planNombre, precioUSD } = req.body;

    // Validar campos requeridos
    if (!userId || !planId || !planNombre || !precioUSD) {
      return res.status(400).json({ error: "Faltan datos para crear la preferencia" });
    }

    // Crear preferencia con el cliente de MercadoPago
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
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
      },
    });

    // ✅ Guardar suscripción en la base de datos
    await new Suscripcion({
      metodoPago: "MercadoPago",
      preferenceId: result.id || result.body?.id,
      planId,
      planNombre,
      userId,
      estado: "pendiente",
      fechaInicio: new Date(),
    }).save();

    // ✅ Responder con el link para iniciar el pago
    res.json({ init_point: result.init_point || result.body?.init_point });
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
