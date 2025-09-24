// routes/upload.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();


// === Configuración de almacenamiento con validación ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Solo se permiten archivos PDF"), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

// === Ruta POST /api/upload ===
router.post("/", upload.single("pdfFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo PDF válido." });
    }

    // Convertir automáticamente el archivo a PDF generado y registrar en historial
    const originalPath = path.join(__dirname, "..", "uploads", req.file.filename);

    const result = await registerPDF({
      originalFilePath: originalPath,
      email: null,
      celular: null,
      origen: "subida-movil"
    });

    if (!result || !result.url) {
      return res.status(500).json({ error: "Error al generar PDF." });
    }

    return res.status(200).json({
      message: "PDF subido y procesado correctamente.",
      url: result.url,
    });
  } catch (error) {
    console.error("Error en /api/upload:", error);
    return res.status(500).json({ message: "Error al procesar el archivo." });
  }
});

module.exports = router;
