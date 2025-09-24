const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFHistory = require('../models/pdfHistory');
const resend = require('resend'); // ya está configurado

// Configuración de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads_temp';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// Ruta para subir y enviar archivo
router.post('/subir-y-enviar', upload.single('archivo'), async (req, res) => {
    try {
        const archivo = req.file;
        const { emailDestino } = req.body;

        if (!archivo || !emailDestino) {
            return res.status(400).json({ error: 'Archivo y correo destino requeridos' });
        }

        // Enviar archivo por Resend
        const data = await resend.emails.send({
            from: 'Sistema Tickets <no-reply@tusistema.com>',
            to: emailDestino,
            subject: 'Archivo enviado desde la aplicación',
            text: 'Adjunto encontrará el archivo enviado.',
            attachments: [
                {
                    filename: archivo.originalname,
                    path: path.resolve(archivo.path),
                },
            ],
        });

        // Guardar historial
        await PDFHistory.create({
            filename: archivo.originalname,
            status: 'Enviado',
        });

        res.json({ success: true, mensaje: 'Archivo enviado correctamente.' });

        // Limpiar archivo temporal después de 10 segundos
        setTimeout(() => {
            fs.unlink(path.resolve(archivo.path), () => {});
        }, 10000);

    } catch (error) {
        console.error('Error al enviar archivo:', error);
        res.status(500).json({ error: 'Error al enviar el archivo.' });
    }
});

module.exports = router;
