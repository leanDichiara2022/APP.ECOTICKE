require("dotenv").config();
require("./db");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const mercadopago = require("mercadopago");

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === "production";

// ===============================
// Middlewares base
// ===============================
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

app.use(
  cors({
    origin: [
      "https://ecoticke.com",
      "https://www.ecoticke.com",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(morgan("combined"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ===============================
// Sesiones
// ===============================
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "clave_super_segura",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // asegúrate NODE_ENV=production si usás HTTPS
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
    },
  })
);

// ===============================
// MongoDB - CONEXIÓN ROBUSTA
// ===============================
/*
  Recomendaciones:
  - Asegurate que MONGO_URI esté en .env o que apunte a tu servidor Mongo.
  - Si usás Mongo local: mongodb://127.0.0.1:27017/ecoticke
  - Si usás Atlas: la cadena de conexión completa.
*/
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecoticke";

async function connectWithRetry() {
  try {
    // Opciones recomendadas para evitar buffering indeterminado
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // time to try selecting a server (ms)
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB conectado correctamente (URI:", MONGO_URI.split("@").slice(-1)[0], ")");
  } catch (err) {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    console.error("   Intentando reconexión en 5s...");
    setTimeout(connectWithRetry, 5000);
  }
}

// Evitar buffering silencioso: logueamos eventos
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err && err.message ? err.message : err);
});
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB desconectado. Reintentando conexión...");
});
mongoose.connection.on("connected", () => {
  console.log("MongoDB: conectado (evento).");
});

connectWithRetry();

// ===============================
// Static public folder
// ===============================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// ===============================
// Rutas HTML
// ===============================
const html = (file) => path.join(publicPath, file);

app.get("/", (req, res) => res.sendFile(html("index.html")));
app.get("/login", (req, res) => res.sendFile(html("login.html")));
app.get("/register", (req, res) => res.sendFile(html("register.html")));

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

app.get("/main", requireLogin, (req, res) => res.sendFile(html("main.html")));
app.get("/tickets", requireLogin, (req, res) => res.sendFile(html("tickets.html")));
app.get("/contacts", requireLogin, (req, res) => res.sendFile(html("contacts.html")));

app.get("/plans", (req, res) => res.sendFile(html("planes.html")));

// ===============================
// MercadoPago
// ===============================
try {
  if (typeof mercadopago.configure === "function") {
    mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });
  } else if (mercadopago.configurations?.setAccessToken) {
    mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);
  }
  console.log("💳 MercadoPago configurado correctamente");
} catch (err) {
  console.error("⚠️ Error configurando MercadoPago:", err.message);
}

// ===============================
// API Routes
// ===============================
try {
  app.use("/api/usuarios", require("./routes/usuarios"));
  app.use("/api/tickets", require("./routes/tickets"));
  app.use("/api/contacts", require("./routes/contacts"));
  app.use("/mercadopago", require("./routes/mercadopago"));
  app.use("/paypal", require("./routes/paypal"));
  app.use("/api/pdf", require("./routes/pdfRoutes"));
  console.log("📡 Todas las rutas API montadas correctamente");
} catch (err) {
  console.error("❌ Error cargando rutas API:", err.message);
}

// ===============================
// Health check
// ===============================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "ECOTICKE Server Running" });
});

// ===============================
// Fallback 404
// ===============================
app.use((req, res) => {
  // Si no existe 404.html, enviamos texto simple
  const file404 = html("404.html");
  try {
    return res.status(404).sendFile(file404);
  } catch (err) {
    return res.status(404).send("404 Not found");
  }
});

// ===============================
// Start
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
