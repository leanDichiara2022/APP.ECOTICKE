const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// 📂 Carpeta donde se guardan los PDFs generados
const generatedDir = path.join(__dirname, "../public/generated_pdfs");
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

// 🧩 Configuración de Multer
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Nueva ruta: /api/pdf/upload
router.post("/upload", upload.single("archivo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo." });

    const originalPath = req.file.path;
    const extension = path.extname(req.file.originalname).toLowerCase();
    const fileName = Date.now() + ".pdf";
    const finalPath = path.join(generatedDir, fileName);

    // Si ya es PDF → mover directamente
    if (extension === ".pdf") {
      fs.renameSync(originalPath, finalPath);
    } else {
      // Si no es PDF → convertir a PDF básico
      const PDFDocument = require("pdfkit");
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(finalPath);
      doc.pipe(stream);
      doc.fontSize(18).text(`Archivo convertido a PDF: ${req.file.originalname}`, { align: "center" });
      doc.moveDown();
      doc.text("Contenido no disponible para este formato.", { align: "center" });
      doc.end();
      fs.unlinkSync(originalPath);
    }

    const pdfUrl = `/generated_pdfs/${fileName}`;

    res.status(200).json({
      message: "✅ Archivo procesado correctamente.",
      fileName,
      pdfUrl,
    });
  } catch (err) {
    console.error("❌ Error al procesar el archivo:", err);
    res.status(500).json({ error: "Error al procesar el archivo." });
  }
});

module.exports = router;
