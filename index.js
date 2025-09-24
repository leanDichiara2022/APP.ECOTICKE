const express = require("express");
const path = require("path");
const fs = require("fs");
const { Resend } = require("resend");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");
const Usuario = require("./models/Usuario");
const History = require("./models/History"); // Asegúrate de que este modelo existe

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificar si la carpeta "public" existe y contiene los archivos esperados
const publicPath = path.join(__dirname, "public");
if (!fs.existsSync(publicPath)) {
  console.error("⚠️ ERROR: La carpeta 'public' no existe.");
}

// Crear directorio para PDFs si no existe
const pdfDirectory = path.join(publicPath, "generated_pdfs");
if (!fs.existsSync(pdfDirectory)) {
  fs.mkdirSync(pdfDirectory, { recursive: true });
}
app.use("/generated_pdfs", express.static(pdfDirectory));

// Configuración de Resend para el envío de correos electrónicos
const resend = new Resend(process.env.RESEND_API_KEY);

// Ruta principal de prueba
app.get("/", (req, res) => {
  res.send("¡Hola! El servidor está funcionando correctamente.");
});

// Servir archivos HTML específicos
app.get("/main", (req, res) => {
  res.sendFile(path.join(publicPath, "main.html"));
});

app.get("/tickets/history", (req, res) => {
  const historyFilePath = path.join(publicPath, "historial.html");

  if (fs.existsSync(historyFilePath)) {
    res.sendFile(historyFilePath);
  } else {
    console.error("⚠️ ERROR: 'historial.html' no encontrado en 'public'.");
    res.status(404).send("Página no encontrada.");
  }
});

// Nueva ruta API para obtener historial de tickets
app.get("/api/tickets/history", async (req, res) => {
  try {
    const history = await History.find(); // Asegúrate de que el modelo History está correctamente configurado
    res.json(history);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener historial de tickets", error });
  }
});

// Obtener lista de usuarios
app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener usuarios", error });
  }
});

// ...todo lo que ya tenés arriba se mantiene igual...

// Importar rutas de PayPal
const paypalRoutes = require("./routes/paypal");
app.use("/paypal", paypalRoutes);

// Ruta para vista de test de PayPal
app.get("/paypal-test", (req, res) => {
  res.sendFile(path.join(publicPath, "paypal_test.html"));
});

// ...resto del código también se mantiene igual...


// Generar PDF
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
    console.log("✅ PDF generado correctamente.");
    res.status(200).json({ mensaje: "PDF generado exitosamente", pdfUrl: "/generated_pdfs/ticket.pdf" });
  });

  writeStream.on("error", (error) => {
    console.error("❌ Error al generar el PDF:", error);
    res.status(500).json({ mensaje: "Error al generar el PDF", error });
  });
});

// Enviar correo electrónico con el PDF
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
    console.log("✅ Correo enviado correctamente.");
    res.status(200).json({ mensaje: "Correo enviado exitosamente", detalles: emailResponse });
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    res.status(500).json({ mensaje: "Error al enviar el correo", error });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
