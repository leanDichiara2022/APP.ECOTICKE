const axios = require('axios');
require('dotenv').config();

// ⚠️ Verificar si las variables están definidas
console.log("🧪 CLIENT_ID:", process.env.PAYPAL_CLIENT_ID || '❌ No definido');
console.log("🧪 CLIENT_SECRET:", process.env.PAYPAL_CLIENT_SECRET || '❌ No definido');

// ✅ Usamos SANDBOX (modo pruebas)
const BASE_URL = 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

async function obtenerAccessToken() {
  try {
    const respuesta = await axios({
      url: `${BASE_URL}/v1/oauth2/token`,
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: CLIENT_ID,
        password: CLIENT_SECRET,
      },
      data: 'grant_type=client_credentials',
    });

    console.log("🟢 Access Token obtenido:", respuesta.data.access_token);
    return respuesta.data.access_token;

  } catch (error) {
    console.error("❌ Error al obtener el token:", error.response?.data || error.message);
    throw error;
  }
}

async function crearPlan(nombre, descripcion, montoUSD) {
  const accessToken = await obtenerAccessToken();

  // Crear PRODUCTO
  const producto = await axios.post(`${BASE_URL}/v1/catalogs/products`, {
    name: nombre,
    description: descripcion,
    type: "SERVICE",
    category: "SOFTWARE",
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  const productId = producto.data.id;

  // Crear PLAN
  const plan = await axios.post(`${BASE_URL}/v1/billing/plans`, {
    product_id: productId,
    name: nombre,
    description: descripcion,
    billing_cycles: [
      {
        frequency: {
          interval_unit: "MONTH",
          interval_count: 1
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // 0 = sin fin
        pricing_scheme: {
          fixed_price: {
            value: montoUSD.toString(),
            currency_code: "USD"
          }
        }
      }
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3
    }
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  return plan.data.id;
}

// Ejecutar creación de planes
(async () => {
  try {
    const personal = await crearPlan("Plan Personal", "Suscripción mensual para usuarios personales", 2);
    const empresarial = await crearPlan("Plan Empresarial", "Suscripción mensual para empresas", 500);

    console.log("✅ Plan Personal ID:", personal);
    console.log("✅ Plan Empresarial ID:", empresarial);
  } catch (err) {
    console.error("❌ Error al crear planes:", err.response?.data || err.message);
  }
})();
