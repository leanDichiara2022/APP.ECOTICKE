const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const router = express.Router();

// 📂 Carpetas necesarias
const generatedDir = path.join(__dirname, "../public/generated_pdfs");
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// 🧩 Configuración de Multer
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Ruta: /api/pdf/upload
router.post("/upload", upload.single("archivo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo." });

    const originalPath = req.file.path;
    const extension = path.extname(req.file.originalname).toLowerCase();
    const fileName = Date.now() + ".pdf";
    const finalPath = path.join(generatedDir, fileName);

    // Si ya es PDF → mover
    if (extension === ".pdf") {
      fs.renameSync(originalPath, finalPath);
    } else {
      // Si no → convertir a PDF básico
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(finalPath);
      doc.pipe(stream);
      doc.fontSize(18).text(`Archivo convertido a PDF: ${req.file.originalname}`, { align: "center" });
      doc.moveDown();
      doc.text("Contenido no disponible para este formato.", { align: "center" });
      doc.end();
      fs.unlinkSync(originalPath);
    }

    res.status(200).json({
      message: "✅ Archivo procesado correctamente.",
      fileName,
      pdfUrl: `/generated_pdfs/${fileName}`,
    });
  } catch (err) {
    console.error("❌ Error al procesar el archivo:", err);
    res.status(500).json({ error: "Error al procesar el archivo." });
  }
});

module.exports = router;
