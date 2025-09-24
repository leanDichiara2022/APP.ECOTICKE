const express = require("express");
const path = require("path");
const fs = require("fs");
const generatePDF = require("../utils/pdfGenerator");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Faltan datos para generar el PDF" });
    }

    const fileName = `pdf_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "../generated_pdfs", fileName);

    await generatePDF(data, filePath);

    res.status(201).json({
      message: "PDF generado con éxito",
      filePath: `/generated_pdfs/${fileName}`,
    });
  } catch (error) {
    console.error("❌ Error generando el PDF:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
