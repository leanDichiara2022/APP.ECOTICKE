const express = require("express");
const router = express.Router();
const PdfHistory = require("../models/pdfHistory");

// Obtener historial de PDFs generados
router.get("/", async (req, res) => {
  try {
    const pdfs = await PdfHistory.find().sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
