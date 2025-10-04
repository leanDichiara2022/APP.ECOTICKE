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
const { Resend } = require("resend");
const PDFDocument = require("pdfkit");
const logger = require("./utils/logger");

// Modelos
const Usuario = require("./models/usuarios");
const History = require("./models/history");
const Ticket = require("./models/ticket");

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

// ================== Rutas principales ==================
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

// ================== Páginas estáticas ==================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/main", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "main.html"));
});

app.get("/planes", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "planes.html"));
});

// ================== PayPal ==================
app.get("/paypal-test", (req, res) => {
    res.render("paypal_test", {
        clientId: process.env.PAYPAL_CLIENT_ID || "NO_CLIENT_ID"
    });
});

app.get("/paypal", (req, res) => {
    const clientId = process.env.PAYPAL_CLIENT_ID || "NO_CLIENT_ID";
    res.render("paypal_final", { PAYPAL_CLIENT_ID: clientId });
});

// ================== Historial tickets ==================
app.get("/history", async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ createdAt: -1 });
        res.render("ticketHistory", { tickets });
    } catch (error) {
        logger.error("❌ Error al cargar historial:", error);
        res.status(500).send("Error al cargar el historial de tickets");
    }
});

// ================== PDF + Email (Resend) ==================
const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/generate-pdf", (req, res) => {
    const { countryCode, phoneNumber, email, extraDetails } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ mensaje: "Número de celular es obligatorio." });
    }

    const pdfPath = path.join(pdfDirectory, "ticket.pdf");
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(pdfPath);

    doc.pipe(writeStream);
    doc.fontSize(16).text("Detalles del Ticket", { align: "center" });
    doc.moveDown();
    doc.fontSize(12)
        .text(`Código de País: ${countryCode}`)
        .text(`Número de Celular: ${phoneNumber}`)
        .text(`Correo Electrónico: ${email || "N/A"}`)
        .text("Detalles Adicionales:")
        .text(extraDetails || "Sin detalles adicionales.");
    doc.end();

    writeStream.on("finish", () => {
        logger.info("✅ PDF generado correctamente.");
        res.status(200).json({ mensaje: "PDF generado exitosamente", pdfUrl: "/generated_pdfs/ticket.pdf" });
    });

    writeStream.on("error", (error) => {
        logger.error("❌ Error al generar el PDF:", error);
        res.status(500).json({ mensaje: "Error al generar el PDF", error });
    });
});

app.post("/send-email", async (req, res) => {
    const { recipientEmail } = req.body;
    if (!recipientEmail) {
        return res.status(400).json({ mensaje: "El correo electrónico del destinatario es obligatorio." });
    }

    const pdfUrl = `${req.protocol}://${req.get("host")}/generated_pdfs/ticket.pdf`;
    const mensaje = `Hola, adjunto encontrarás el enlace a tu ticket generado: ${pdfUrl}`;

    try {
        const emailResponse = await resend.emails.send({
            from: "tu-correo-verificado@tu-dominio.com",
            to: recipientEmail,
            subject: "Tu Ticket Generado",
            text: mensaje,
        });
        logger.info("✅ Correo enviado correctamente.");
        res.status(200).json({ mensaje: "Correo enviado exitosamente", detalles: emailResponse });
    } catch (error) {
        logger.error("❌ Error al enviar el correo:", error);
        res.status(500).json({ mensaje: "Error al enviar el correo", error });
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
