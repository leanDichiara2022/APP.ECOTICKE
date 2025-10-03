// server.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const logger = require("./utils/logger");

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();

// ================== Conexión a MongoDB ==================
const connectDB = async () => {
    try {
        logger.info("⏳ Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info("✅ Conectado a MongoDB");
    } catch (error) {
        logger.error("❌ Error al conectar a MongoDB:", error.message);
        process.exit(1);
    }
};

// ================== Configuración Motor de Vistas ==================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

// ================== Middlewares de Seguridad ==================
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "⚠️ Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde"
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Cookies seguras
app.use(cookieParser());
app.use((req, res, next) => {
    res.cookie("session", "active", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });
    next();
});

// ================== CORS ==================
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://ecoticke.com"
    ],
    credentials: true
}));

// Logs básicos
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// ================== Carpetas Estáticas ==================
const pdfDirectory = path.join(__dirname, "generated_pdfs");
if (!fs.existsSync(pdfDirectory)) fs.mkdirSync(pdfDirectory, { recursive: true });
app.use("/generated_pdfs", express.static(pdfDirectory));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.use(express.static(path.join(__dirname, "public")));

// ================== Modelos ==================
const Ticket = require("./models/ticket");

// ================== Rutas ==================
app.use("/api/templates", require("./routes/templates"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/upload-send", require("./routes/uploadAndSend"));
app.use("/api/enviar-pdf", require("./routes/enviarPDF"));
app.use("/api/paypal", require("./routes/paypal"));
app.use("/api/suscripciones", require("./routes/suscripciones"));
app.use("/api/history", require("./routes/historyRoutes"));
app.use("/pdf", require("./routes/pdfRoutes"));
app.use("/api/auth", require("./routes/userRoutes"));
app.use("/", require("./routes/planes"));
app.use("/api/pdf", require("./routes/pdfUpload"));

// ================== Rutas Extras ==================
// Página inicial -> index.html (login / registro)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Página principal -> main.html
app.get("/main", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "main.html"));
});

// Página planes
app.get("/planes", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "planes.html"));
});

// Test PayPal
app.get("/paypal-test", (req, res) => {
    res.render("paypal_test", {
        clientId: process.env.PAYPAL_CLIENT_ID || "NO_CLIENT_ID"
    });
});

// Vista final PayPal
app.get("/paypal", (req, res) => {
    const clientId = process.env.PAYPAL_CLIENT_ID || "NO_CLIENT_ID";
    res.render("paypal_final", { PAYPAL_CLIENT_ID: clientId });
});

// Historial tickets
app.get("/history", async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ createdAt: -1 });
        res.render("ticketHistory", { tickets });
    } catch (error) {
        logger.error("❌ Error al cargar historial:", error);
        res.status(500).send("Error al cargar el historial de tickets");
    }
});

// Vista previa plantillas
app.get("/preview/:template", (req, res) => {
    const { template } = req.params;
    const templatesAvailable = {
        "factura_detallada": "factura_detallada",
        "factura_simple": "factura_simple",
        "factura_editable": "factura_editable",
        "pdf_template_2": "pdf_template_2"
    };

    if (!templatesAvailable[template]) {
        return res.status(404).send("❌ Plantilla no encontrada");
    }

    try {
        res.render(templatesAvailable[template], {
            fecha: new Date().toLocaleDateString(),
            logo_url: "/uploads/logo.png",
            nombre_negocio: "Mi Negocio",
            direccion_negocio: "Calle Falsa 123",
            descripcion: "Factura de prueba",
            items: [
                { producto: "Producto A", cantidad: 2, precio: 10.00 },
                { producto: "Producto B", cantidad: 1, precio: 20.00 }
            ],
            total: 40.00
        });
    } catch (err) {
        logger.error("❌ Error al renderizar la plantilla:", err);
        res.status(500).send("Error al renderizar la plantilla");
    }
});

// ================== Middleware de Errores ==================
app.use((err, req, res, next) => {
    logger.error(`Error en request: ${err.message}`, { stack: err.stack });
    res.status(500).json({ message: "Error interno del servidor" });
});

// ================== Levantar Servidor ==================
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
        logger.info(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
});
