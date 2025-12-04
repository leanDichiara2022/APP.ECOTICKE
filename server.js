require("dotenv").config();
require("./db");

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mercadopago = require("mercadopago");

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === "production";

// ===============================
// Middlewares base
// ===============================
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// Cookies para JWT
app.use(cookieParser());

// CORS seguro para envío de cookies
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
// MongoDB - CONEXIÓN ROBUSTA
// ===============================
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecoticke";

async function connectWithRetry() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB conectado correctamente");
  } catch (err) {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    console.error("   Intentando reconexión en 5s...");
    setTimeout(connectWithRetry, 5000);
  }
}

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err.message);
});
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB desconectado, reintentando...");
});
mongoose.connection.on("connected", () => {
  console.log("MongoDB EVENTO: conectado.");
});

connectWithRetry();

// ===============================
// Static public folder
// ===============================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// ===============================
// Rutas Frontend HTML
// ===============================
const html = (file) => path.join(publicPath, file);

app.get("/", (req, res) => res.sendFile(html("index.html")));
app.get("/login", (req, res) => res.sendFile(html("login.html")));
app.get("/register", (req, res) => res.sendFile(html("register.html")));
app.get("/main", (req, res) => res.sendFile(html("main.html")));
app.get("/tickets", (req, res) => res.sendFile(html("tickets.html")));
app.get("/contacts", (req, res) => res.sendFile(html("contacts.html")));
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
  console.log("📡 Todas las rutas API cargadas correctamente");
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
  const file404 = html("404.html");
  try {
    res.status(404).sendFile(file404);
  } catch (err) {
    res.status(404).send("404 Not found");
  }
});

// ===============================
// Start
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
