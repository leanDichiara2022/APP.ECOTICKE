// crear_suscripcion.js
require('dotenv').config();

const { MercadoPagoConfig, PreApproval } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const crearSuscripcion = async () => {
  try {
    const result = await new PreApproval(client).create({
      body: {
        reason: "Suscripción mensual al plan personal",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 2.0,
          currency_id: "USD",
          start_date: new Date().toISOString(),
          end_date: "2030-12-31T00:00:00.000-03:00"
        },
        back_url: "https://tuapp.com/subscripcion-exitosa",
        payer_email: "cliente-test@correo.com" // Puede omitirse, se pide al usuario
      }
    });

    console.log("✅ Suscripción generada correctamente:");
    console.log("🔗 URL para activar suscripción:", result.init_point);
  } catch (error) {
    console.error("❌ Error al crear suscripción:", error);
  }
};

crearSuscripcion();
