require("dotenv").config();
const express = require("express");
const fs = require("fs");
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
// 🔐 Middlewares base
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
// 💾 Sesiones y seguridad
// ===============================
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "clave_super_segura",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
    },
  })
);

// ===============================
// 🧠 MongoDB
// ===============================
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecoticke")
  .then(() => console.log("✅ MongoDB conectado correctamente"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err.message));

// ===============================
// 🌐 Paths
// ===============================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));


// ===============================
// 🔑 Middleware global para token
// ===============================
app.use((req, res, next) => {
  if (req.query.token && !req.headers["x-auth-token"]) {
    req.headers["x-auth-token"] = req.query.token;
  }
  next();
});

// ===============================
// 🔐 Middleware auth real
// ===============================
const auth = require("./middlewares/auth");

// ===============================
// 📄 Rutas públicas
// ===============================
app.get("/", (req, res) => res.sendFile(path.join(publicPath, "index.html")));
app.get("/register", (req, res) =>
  res.sendFile(path.join(publicPath, "register.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(publicPath, "login.html"))
);

// ===============================
// 🔐 Rutas protegidas HTML (desde /public)
// ===============================
app.get("/main", auth, (req, res) =>
  res.sendFile(path.join(publicPath, "main.html"))
);
app.get("/main.html", auth, (req, res) =>
  res.sendFile(path.join(publicPath, "main.html"))
);

app.get("/tickets", auth, (req, res) =>
  res.sendFile(path.join(publicPath, "tickets.html"))
);
app.get("/tickets.html", auth, (req, res) =>
  res.sendFile(path.join(publicPath, "tickets.html"))
);

app.get("/contacts", auth, (req, res) =>
  res.sendFile(path.join(publicPath, "contacts.html"))
);
app.get("/contacts.html", auth, (req, res) =>
  res.sendFile(path.join(publicPath, "contacts.html"))
);

app.get("/plans", auth, (req, res) =>
  res.sendFile(path.join(publicPath, "plans.html"))
);
app.get("/plans.html", auth, (req, res) =>
  res.sendFile(path.join(publicPath, "plans.html"))
);

// ===============================
// 💳 MercadoPago
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
// 🧩 Rutas API
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
// 🩺 Health Check
// ===============================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "ECOTICKE Server Running" });
});

// ===============================
// ⚠️ Fallback 404
// ===============================
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Endpoint no encontrado" });
  }
  res.status(404).sendFile(path.join(publicPath, "404.html"), (err) => {
    if (err) res.status(404).send("Not Found");
  });
});

// ===============================
// 🚀 Iniciar servidor
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
