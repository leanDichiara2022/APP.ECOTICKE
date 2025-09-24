const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdf = require("html-pdf");
const router = express.Router();

// Configuración de Multer para la subida de imágenes
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Ruta para generar PDF con plantilla seleccionada
router.post("/generar-pdf", upload.single("logo"), (req, res) => {
    const { nombre_negocio, descripcion, plantilla } = req.body;
    const logoPath = req.file ? `/uploads/${req.file.filename}` : "";

    // Leer la plantilla seleccionada
    const templatePath = path.join(__dirname, "../templates", plantilla);
    fs.readFile(templatePath, "utf8", (err, htmlTemplate) => {
        if (err) return res.status(500).json({ error: "Error al cargar la plantilla" });

        // Reemplazar variables en la plantilla
        const htmlContent = htmlTemplate
            .replace("{{nombre_negocio}}", nombre_negocio)
            .replace("{{descripcion}}", descripcion)
            .replace("{{logo_url}}", logoPath);

        // Configuración y generación del PDF
        const pdfPath = `./generated_pdfs/${Date.now()}.pdf`;
        pdf.create(htmlContent).toFile(pdfPath, (err, result) => {
            if (err) return res.status(500).json({ error: "Error al generar el PDF" });
            res.json({ url: pdfPath });
        });
    });
});

module.exports = router;
