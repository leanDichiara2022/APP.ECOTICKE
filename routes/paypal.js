const express = require("express");
const router = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");
const Suscripcion = require("../models/suscripciones");

dotenv.config();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET; // ✅ corregido

// 🔄 Cambiar entre SANDBOX y LIVE según env
const PAYPAL_API_BASE = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

console.log("✅ PAYPAL_CLIENT_ID:", PAYPAL_CLIENT_ID || "NO DEFINIDO");
console.log("✅ PAYPAL_SECRET:", PAYPAL_SECRET ? "CARGADO" : "NO DEFINIDO");
console.log("🌍 PayPal API:", PAYPAL_API_BASE);

// 📌 Crear orden
router.post("/create-order", async (req, res) => {
  try {
    const auth = await axios({
      url: `${PAYPAL_API_BASE}/v1/oauth2/token`,
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: PAYPAL_CLIENT_ID, password: PAYPAL_SECRET },
      data: "grant_type=client_credentials"
    });

    const access_token = auth.data.access_token;

    const order = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders`,
      method: "post",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${access_token}` },
      data: {
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: "2.00" }
        }]
      }
    });

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
      data: "grant_type=client_credentials"
    });

    const access_token = auth.data.access_token;

    const capture = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      method: "post",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${access_token}` }
    });

    // Guardar en DB
    const pago = capture.data;
    const nueva = new Suscripcion({
      paypalOrderId: orderId,
      estado: pago.status || "UNKNOWN",
      fecha: new Date()
    });
    await nueva.save();

    res.json({ message: "Pago capturado y guardado", data: pago });
  } catch (error) {
    console.error("❌ Error al capturar orden PayPal:", error.response?.data || error.message);
    res.status(500).json({ error: "Error al capturar orden PayPal" });
  }
});

// 📌 Listar suscripciones
router.get("/listar-suscripciones", async (req, res) => {
  try {
    const todas = await Suscripcion.find().sort({ fecha: -1 });
    res.json(todas);
  } catch (error) {
    console.error("❌ Error al listar suscripciones:", error);
    res.status(500).json({ error: "Error al obtener suscripciones" });
  }
});

module.exports = router;
