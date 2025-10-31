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

// Inicializar app
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === "production";

// Middlewares base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Trust proxy
app.set("trust proxy", 1);

// Sesiones
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

// Conexión MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecoticke")
  .then(() => console.log("✅ MongoDB conectado correctamente"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err.message));

// Archivos estáticos públicos
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// 🔹 Middleware para aceptar token desde querystring (por si viene en la URL)
app.use((req, res, next) => {
  if (req.query.token && !req.headers["x-auth-token"]) {
    req.headers["x-auth-token"] = req.query.token;
  }
  next();
});

// 🔹 Middleware de redirección global (HTML protegido)
const auth = require("./middlewares/auth");
app.use((req, res, next) => {
  const token = req.headers["x-auth-token"];
  const isHtmlRoute =
    req.path.endsWith(".html") ||
    ["/main", "/tickets", "/contacts", "/plans"].includes(req.path);

  // Redirigir al login si no hay token
  if (isHtmlRoute && !token && !req.path.startsWith("/login") && !req.path.startsWith("/register")) {
    return res.redirect("/login.html");
  }
  next();
});

// 🔹 Rutas públicas
app.get("/", (req, res) => res.sendFile(path.join(publicPath, "index.html")));
app.get("/register", (req, res) => res.sendFile(path.join(publicPath, "register.html")));
app.get("/login", (req, res) => res.sendFile(path.join(publicPath, "login.html")));

// 🔹 Rutas protegidas (HTML)
const viewsPath = path.join(__dirname, "views");
app.get("/main", auth, (req, res) => res.sendFile(path.join(viewsPath, "main.html")));
app.get("/tickets", auth, (req, res) => res.sendFile(path.join(viewsPath, "tickets.html")));
app.get("/contacts", auth, (req, res) => res.sendFile(path.join(viewsPath, "contacts.html")));
app.get("/plans", auth, (req, res) => res.sendFile(path.join(viewsPath, "plans.html")));

// 🔹 Rutas API
try {
  app.use("/api/usuarios", require("./routes/usuarios"));
  app.use("/api/tickets", require("./routes/tickets"));
  app.use("/api/contacts", require("./routes/contacts"));
  app.use("/mercadopago", require("./routes/mercadopago"));
  app.use("/paypal", require("./routes/paypal"));

  // ✅ Ruta PDF unificada
  app.use("/api/pdf", require("./routes/pdfRoutes"));

  console.log("📡 Todas las rutas montadas correctamente");
} catch (err) {
  console.error("❌ Error cargando rutas:", err.message);
}

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Fallback 404
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/usuarios") || req.path.startsWith("/register")) {
    return res.status(404).json({ message: "Endpoint no encontrado" });
  }
  res.status(404).sendFile(path.join(publicPath, "404.html"), (err) => {
    if (err) res.status(404).send("Not Found");
  });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor HTTP corriendo en http://0.0.0.0:${PORT} (usa Nginx para TLS)`);
});
