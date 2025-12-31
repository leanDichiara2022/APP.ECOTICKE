const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mercadopago = require("mercadopago");
const fs = require("fs");

require("dotenv").config();
require("./db");

const app = express();

/* ===============================
   BASE URL GLOBAL
=============================== */
const BASE_URL =
  process.env.BASE_URL ||
  process.env.APP_URL ||
  "https://ecoticke.com";

global.BASE_URL = BASE_URL;

console.log("BASE_URL usada:", global.BASE_URL);

/* ===============================
   CONFIG GENERAL
=============================== */
app.set("trust proxy", 1);
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

/* ===============================
   MIDDLEWARES
=============================== */
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "https://ecoticke.com",
      "https://www.ecoticke.com",
      "http://localhost:3000",
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
});
app.use(limiter);

/* ===============================
   MONGO
=============================== */
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecoticke";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB conectado correctamente"))
  .catch((e) => console.log("Mongo error:", e.message));

/* ===============================
   RUTAS ESTÁTICAS
=============================== */

// public
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// generated_pdfs públicos
const pdfPath = path.join(__dirname, "public", "generated_pdfs");

if (!fs.existsSync(pdfPath)) fs.mkdirSync(pdfPath);

console.log("Carpeta PDFs:", pdfPath);

app.use(
  "/generated_pdfs",
  express.static(pdfPath, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);

/* ===============================
   HTML SIMPLES
=============================== */
const html = (file) => path.join(publicPath, file);

app.get("/", (_, res) => res.sendFile(html("index.html")));
app.get("/main", (_, res) => res.sendFile(html("main.html")));
app.get("/login", (_, res) => res.sendFile(html("login.html")));
app.get("/register", (_, res) => res.sendFile(html("register.html")));
app.get("/tickets", (_, res) => res.sendFile(html("tickets.html")));
app.get("/contacts", (_, res) => res.sendFile(html("contacts.html")));
app.get("/planes", (_, res) => res.sendFile(html("planes.html")));

/* ===============================
   API REAL
=============================== */

// RUTA DE ENVÍO DE PDF / WHATSAPP
const enviarPDFRoutes = require("./routes/enviarPDF");
app.use("/api/send", enviarPDFRoutes);

app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/tickets", require("./routes/tickets"));
app.use("/api/contacts", require("./routes/contacts"));
app.use("/api/pdf", require("./routes/pdfRoutes"));
app.use("/api/upload-send", require("./routes/uploadAndSend"));
app.use("/api", require("./routes/mensajeria"));

/* ===============================
   HEALTHCHECK
=============================== */
app.get("/health", (req, res) =>
  res.json({ ok: true, base: global.BASE_URL })
);

/* ===============================
   404 – SIEMPRE AL FINAL
=============================== */
app.use((req, res) => {
  console.log("404 en:", req.originalUrl);

  res.status(404).sendFile(html("404.html"), (err) => {
    if (err) {
      console.error("No se pudo enviar 404.html:", err.message);
      if (!res.headersSent) res.status(404).send("404");
    }
  });
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
