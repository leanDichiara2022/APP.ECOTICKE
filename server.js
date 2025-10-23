// server.js
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

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === "production";

// Middleware base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🌍 CORS - permitir dominio y localhost para pruebas
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

// 🛡️ Helmet: desactivar CSP por defecto porque rompía inline scripts/styles locales
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 📜 Logs HTTP
app.use(morgan("combined"));

// 🧱 Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ✅ Ajuste seguro de proxy (corrige el error que viste)
app.set("trust proxy", 1); // confía solo en Nginx, no en todas las IPs

// 🔐 Sesiones
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

// 🧩 Conexión a MongoDB
if (!process.env.MONGO_URI) {
  console.warn("⚠️ MONGO_URI no definido en .env — la app intentará iniciar pero sin BD.");
}
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecoticke")
  .then(() => console.log("✅ MongoDB conectado correctamente"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err.message || err));

// 📂 Archivos estáticos
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// 🧭 Rutas HTML principales
app.get("/", (req, res) => res.sendFile(path.join(publicPath, "index.html")));
app.get("/register", (req, res) => res.sendFile(path.join(publicPath, "register.html")));
app.get("/login", (req, res) => res.sendFile(path.join(publicPath, "login.html")));
app.get("/main", (req, res) => res.sendFile(path.join(publicPath, "main.html")));

// 🔄 Cargar rutas dinámicamente desde /routes
const routesPath = path.join(__dirname, "routes");
if (fs.existsSync(routesPath)) {
  fs.readdirSync(routesPath).forEach((file) => {
    if (!file.endsWith(".js")) return;
    const routePath = path.join(routesPath, file);
    try {
      const router = require(routePath);
      const name = path.basename(file, ".js");

      // Usuarios → /api/usuarios
      if (["usuarios", "userRoutes", "user"].includes(name)) {
        app.use("/api/usuarios", router);
        console.log(`📡 Mounted route ${file} -> /api/usuarios`);
        return;
      }

      // Otros routes
      app.use(`/${name}`, router);
      console.log(`📡 Mounted route ${file} -> /${name}`);
    } catch (err) {
      console.error(`❌ Error cargando route ${file}:`, err.message || err);
    }
  });
} else {
  console.warn("⚠️ No se encontró la carpeta 'routes'. Verifica la estructura del proyecto.");
}

// 🩺 Health check
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// 🧱 Fallback 404
app.use((req, res, next) => {
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/usuarios") ||
    req.path.startsWith("/register")
  ) {
    return res.status(404).json({ message: "Endpoint no encontrado" });
  }
  res.status(404).sendFile(path.join(publicPath, "404.html"), (err) => {
    if (err) res.status(404).send("Not Found");
  });
});

// 🚀 Iniciar servidor HTTP (Nginx gestiona TLS)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor HTTP corriendo en http://0.0.0.0:${PORT} (usa Nginx para TLS)`);
});
