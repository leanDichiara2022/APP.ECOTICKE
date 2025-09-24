require('dotenv').config();
const mercadopago = require('mercadopago');

// Configuración de MercadoPago
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

// Crear preferencia
const crearPreferencia = async () => {
  try {
    const preference = {
      items: [
        {
          title: 'Suscripción Plan Personal',
          unit_price: 2.0,   // valor en USD si querés internacional, ARS si local
          quantity: 1,
          currency_id: 'USD'
        }
      ],
      back_urls: {
        success: 'https://tudominio.com/pago-exitoso',
        failure: 'https://tudominio.com/pago-fallido',
        pending: 'https://tudominio.com/pago-pendiente'
      },
      auto_return: 'approved',
      binary_mode: true // asegura que el pago se apruebe o rechace inmediatamente
    };

    const response = await mercadopago.preferences.create(preference);

    console.log("✅ Preferencia creada con éxito:");
    console.log("🧾 ID:", response.body.id);
    console.log("🔗 URL de pago:", response.body.init_point);
  } catch (error) {
    console.error("❌ Error al crear la preferencia:", error);
  }
};

crearPreferencia();
