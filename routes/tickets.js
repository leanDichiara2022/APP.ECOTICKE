const express = require("express");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const Ticket = require("../models/Ticket");
const auth = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

// Ruta para generar PDF y guardar el ticket (requiere autenticación)
router.post("/generate-pdf", auth, async (req, res) => {
  try {
    const { countryCode, phoneNumber, email, extraDetails } = req.body;

    if (!countryCode || !phoneNumber || !email) {
      logger.warn("Intento de generar PDF con campos incompletos", { user: req.user.id });
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const pdfDirectory = path.join(__dirname, "..", "public", "generated_pdfs");
    if (!fs.existsSync(pdfDirectory)) fs.mkdirSync(pdfDirectory, { recursive: true });

    const uniqueFilename = `ticket_${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDirectory, uniqueFilename);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));

    doc.fontSize(20).text("Ticket Generado", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Código de País: ${countryCode}`);
    doc.text(`Número de Teléfono: ${phoneNumber}`);
    doc.text(`Correo Electrónico: ${email}`);
    if (extraDetails) doc.text(`Detalles Adicionales: ${extraDetails}`);
    doc.end();

    const nuevoTicket = new Ticket({
      cliente: `${countryCode} ${phoneNumber}`,
      detalles: extraDetails || "Sin detalles",
      status: "Pendiente",
      usuario: req.user.id
    });

    await nuevoTicket.save();
    logger.info("Ticket generado correctamente", { ticketId: nuevoTicket._id, user: req.user.id });

    res.status(200).json({
      message: "PDF generado y ticket registrado correctamente",
      pdfUrl: `/generated_pdfs/${uniqueFilename}`,
      ticketId: nuevoTicket._id,
    });
  } catch (error) {
    logger.error("Error al generar el PDF", { error, user: req.user?.id });
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener todos los tickets (requiere autenticación)
router.get("/history", auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ usuario: req.user.id }).sort({ createdAt: -1 });
    logger.info("Historial de tickets consultado", { user: req.user.id, count: tickets.length });
    res.json(tickets);
  } catch (error) {
    logger.error("Error al obtener historial de tickets", { error, user: req.user.id });
    res.status(500).json({ error: "Error al obtener el historial de tickets" });
  }
});

// Vista renderizada del historial (requiere autenticación)
router.get("/history/view", auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ usuario: req.user.id }).sort({ createdAt: -1 });
    res.render("ticketHistory", { tickets });
    logger.info("Vista de historial cargada", { user: req.user.id });
  } catch (error) {
    logger.error("Error al cargar la vista del historial", { error, user: req.user.id });
    res.status(500).send("Error al cargar la página");
  }
});

// Eliminar ticket por ID (requiere autenticación)
router.delete("/history/delete/:id", auth, async (req, res) => {
  try {
    const deleted = await Ticket.findOneAndDelete({ _id: req.params.id, usuario: req.user.id });
    if (deleted) {
      logger.info("Ticket eliminado correctamente", { ticketId: req.params.id, user: req.user.id });
      res.json({ success: true });
    } else {
      logger.warn("Intento de eliminar ticket no encontrado", { ticketId: req.params.id, user: req.user.id });
      res.status(404).json({ success: false, error: "Ticket no encontrado" });
    }
  } catch (error) {
    logger.error("Error al eliminar ticket", { error, ticketId: req.params.id, user: req.user.id });
    res.status(500).json({ success: false, error: "Error al eliminar ticket" });
  }
});

module.exports = router;
