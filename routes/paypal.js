// routes/paypal.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");
const Suscripcion = require("../models/suscripciones");

dotenv.config();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Cambiar entre SANDBOX o LIVE automáticamente
const PAYPAL_API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// 📌 Crear orden de pago
router.post("/create-order", async (req, res) => {
  try {
    const { planNombre, precioUSD, userId, planId } = req.body;

    const auth = await axios({
      url: `${PAYPAL_API_BASE}/v1/oauth2/token`,
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: PAYPAL_CLIENT_ID, password: PAYPAL_SECRET },
      data: "grant_type=client_credentials",
    });

    const access_token = auth.data.access_token;

    const order = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: precioUSD },
            description: `Suscripción: ${planNombre}`,
          },
        ],
        application_context: {
          brand_name: "Ecoticke",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: `${process.env.BASE_URL}/planes?status=success&plan=${planNombre}`,
          cancel_url: `${process.env.BASE_URL}/planes?status=cancel`,
        },
      },
    });

    // Guardar suscripción en BD
    await new Suscripcion({
      metodoPago: "PayPal",
      paypalOrderId: order.data.id,
      planId,
      planNombre,
      userId,
      estado: "pendiente",
      fechaInicio: new Date(),
    }).save();

    res.json({ id: order.data.id });
  } catch (error) {
    console.error("❌ Error al crear orden PayPal:", error.response?.data || error.message);
    res.status(500).json({ error: "Error al crear orden PayPal" });
  }
});

// 📌 Capturar orden (confirmar pago)
router.post("/capture-order/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const auth = await axios({
      url: `${PAYPAL_API_BASE}/v1/oauth2/token`,
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: PAYPAL_CLIENT_ID, password: PAYPAL_SECRET },
      data: "grant_type=client_credentials",
    });

    const access_token = auth.data.access_token;

    const capture = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    });

    // Actualizar suscripción
    const pago = capture.data;
    await Suscripcion.findOneAndUpdate(
      { paypalOrderId: orderId },
      { estado: "activo", fechaAprobacion: new Date() },
      { new: true }
    );

    res.json({ message: "Pago capturado y guardado", data: pago });
  } catch (error) {
    console.error("❌ Error al capturar orden PayPal:", error.response?.data || error.message);
    res.status(500).json({ error: "Error al capturar orden PayPal" });
  }
});

module.exports = router;
