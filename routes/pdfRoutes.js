const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middlewares/auth");
const { generarPDF, registerPDF } = require("../controllers/pdfController");

// Configuración de Multer blindada
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de archivo no permitido"));
    }
  }
});

// Ruta protegida para generación de PDF desde frontend
router.post("/generar", auth, generarPDF);

// Ruta para carga de PDF desde móvil (upload manual)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió el archivo" });
    }

    const originalFilePath = req.file.path;
    const { email, celular } = req.body;

    const result = await registerPDF({
      originalFilePath,
      email: email || null,
      celular: celular || null,
      origen: "manual"
    });

    if (result.success) {
      res.json({ message: "Archivo registrado exitosamente", url: result.url });
    } else {
      console.error("Error en registerPDF:", result.error);
      res.status(500).json({ error: "Error al registrar el PDF" });
    }
  } catch (error) {
    console.error("Error en el upload:", error);
    res.status(500).json({ error: "Error al enviar el archivo." });
  }
});

module.exports = router;
