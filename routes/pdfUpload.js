const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { registerPDF } = require("../controllers/pdfController");
const { setCustomTemplate } = require("../controllers/templates");

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, "..", "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        const timestamp = Date.now();
        const uniqueName = `${baseName}_${timestamp}${ext}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ storage: storage });

// ✅ Subida de PDF normal
router.post("/upload", upload.any(), async (req, res) => {
    try {
        const { email, celular } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No se recibió ningún archivo" });
        }

        const uploadedFile = req.files[0];
        const originalFilePath = uploadedFile.path;

        const resultado = await registerPDF({
            originalFilePath,
            email: email || null,
            celular: celular || null,
            origen: "manual"
        });

        if (resultado.success) {
            res.json({
                message: "PDF subido y registrado correctamente",
                url: resultado.url,
                fileName: uploadedFile.filename
            });
        } else {
            res.status(500).json({ error: resultado.error });
        }
    } catch (error) {
        console.error("Error al subir PDF:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ✅ Subida de plantilla personalizada
router.post("/upload-template", upload.single("plantilla"), async (req, res) => {
    try {
        const { usuarioId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No se recibió ninguna plantilla" });
        }

        const fileName = req.file.filename;

        // Guardamos en configuración del usuario
        await setCustomTemplate({ body: { usuarioId, fileName } }, res);
    } catch (error) {
        console.error("Error al subir plantilla personalizada:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

module.exports = router;
