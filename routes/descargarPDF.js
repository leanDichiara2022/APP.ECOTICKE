const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Ruta para descargar un PDF por su nombre de archivo
router.get("/descargar/:filename", (req, res) => {
  const { filename } = req.params;
  const pdfPath = path.join(__dirname, "../generated_pdfs", filename);

  // Verificar si el archivo existe
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: "El archivo no existe" });
  }

  // Enviar el archivo como descarga
  res.download(pdfPath, filename, (err) => {
    if (err) {
      console.error("Error al descargar el archivo:", err);
      res.status(500).json({ error: "Error al descargar el archivo" });
    }
  });
});

module.exports = router;
