const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const PDFHistory = require("../models/pdfHistory");
const { Resend } = require("resend");

const resendClient = new Resend(process.env.RESEND_API_KEY);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads_temp";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post(
  "/subir-y-enviar",
  upload.single("archivo"),
  async (req, res) => {
    try {
      const file = req.file;
      const { emailDestino } = req.body;

      if (!file || !emailDestino)
        return res
          .status(400)
          .json({ error: "Archivo y correo requeridos" });

      await resendClient.emails.send({
        from: "Tickets <no-reply@ecoticke.com>",
        to: emailDestino,
        subject: "Tu archivo",
        text: "Adjuntamos archivo solicitado",
        attachments: [
          {
            filename: file.originalname,
            content: fs.readFileSync(file.path),
          },
        ],
      });

      await PDFHistory.create({
        filename: file.originalname,
        status: "enviado",
      });

      res.json({ ok: true });

      setTimeout(() => fs.unlinkSync(file.path), 10000);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al enviar" });
    }
  }
);

module.exports = router;
