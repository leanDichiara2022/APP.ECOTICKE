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
const fs = require("fs");

const app = express();

// ===============================
// BASE URL
// ===============================
const FORCED_BASE_URL =
  process.env.BASE_URL ||
  process.env.APP_URL ||
  "https://ecoticke.com";

global.BASE_URL = FORCED_BASE_URL;

app.set("trust proxy", 1);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// ===============================
// Middlewares base
// ===============================
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

// ===============================
// Mongo
// ===============================
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecoticke";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB conectado correctamente"))
  .catch((e) => console.log("Mongo error:", e.message));

// ===============================
// Rutas estáticas
// ===============================
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// carpeta PDFs
const pdfPath = path.join(__dirname, "generated_pdfs");
if (!fs.existsSync(pdfPath)) fs.mkdirSync(pdfPath);

app.use(
  "/generated_pdfs",
  express.static(pdfPath, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);

// ===============================
// HTML
// ===============================
const html = (file) => path.join(publicPath, file);

app.get("/", (_, res) => res.sendFile(html("index.html")));
app.get("/main", (_, res) => res.sendFile(html("main.html")));
app.get("/login", (_, res) => res.sendFile(html("login.html")));
app.get("/register", (_, res) => res.sendFile(html("register.html")));
app.get("/tickets", (_, res) => res.sendFile(html("tickets.html")));
app.get("/contacts", (_, res) => res.sendFile(html("contacts.html")));
app.get("/planes", (_, res) => res.sendFile(html("planes.html")));

// ===============================
// API
// ===============================
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/tickets", require("./routes/tickets"));
app.use("/api/contacts", require("./routes/contacts"));
app.use("/api/pdf", require("./routes/pdfRoutes"));
app.use("/api/upload-send", require("./routes/uploadAndSend"));

// ===============================
// HEALTH
// ===============================
app.get("/health", (req, res) =>
  res.json({ ok: true, base: global.BASE_URL })
);

// ===============================
// 404 SOLO AL FINAL
// ===============================
app.use((req, res) => {
  res.status(404).sendFile(html("404.html"), (err) => {
    res.status(404).send("404");
  });
});

// ===============================
// LISTEN
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor en puerto ${PORT}`);
});
