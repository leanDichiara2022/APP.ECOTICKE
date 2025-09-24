// routes/templates.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  setTemplate,
  getUserTemplate,
  uploadCustomTemplate,
} = require("../controllers/templates");

const router = express.Router();

// =========================
// Configuración de Multer
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/templates");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// =========================
// Rutas
// =========================

// 📌 Guardar plantilla seleccionada (predeterminada)
router.post("/set", setTemplate);

// 📌 Obtener plantilla actual de un usuario
router.get("/:usuarioId", getUserTemplate);

// 📌 Subir plantilla personalizada (archivo EJS o similar)
router.post("/upload-template", upload.single("plantilla"), uploadCustomTemplate);

module.exports = router;
