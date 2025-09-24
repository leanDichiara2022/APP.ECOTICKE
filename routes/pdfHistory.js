const express = require("express");
const router = express.Router();
const PDFHistory = require("../models/pdfHistory"); // Asegurar importación correcta

// Obtener historial de PDFs generados con paginación
router.get("/", async (req, res) => {
  try {
    console.log("Recibiendo petición de historial...");
    const history = await PDFHistory.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: "Error al obtener historial de PDFs." });
  }
});

module.exports = router;
