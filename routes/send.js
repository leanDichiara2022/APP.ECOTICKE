// routes/send.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const sendEmail = require("../utils/sendEmail");
const generarWhatsappLink = require("../utils/sendWhatsapp");

const router = express.Router();

// ===============================
// 📧 Enviar por Email (LINK)
// ===============================
router.post("/correo", async (req, res) => {
  try {
    const { email, fileName } = req.body;

    if (!email || !fileName) {
      return res.status(400).json({ ok: false, error: "Faltan datos" });
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const fileUrl = `${baseUrl}/generated_pdfs/${fileName}`;

    await sendEmail({
      to: email,
      subject: "Tu ticket digital",
      html: `
        <p>Hola 👋</p>
        <p>Podés ver o descargar tu ticket desde el siguiente enlace:</p>
        <p><a href="${fileUrl}" target="_blank">${fileUrl}</a></p>
        <p>Gracias por usar EcoTicke 🌱</p>
      `,
    });

    res.json({
      ok: true,
      message: "Correo enviado correctamente",
      url: fileUrl,
    });
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    res.status(500).json({ ok: false, error: "Error enviando correo" });
  }
});

// ===============================
// 📱 Enviar por WhatsApp (LINK)
// ===============================
router.post("/whatsapp", async (req, res) => {
  try {
    const { phoneNumber, fileName, details } = req.body;

    if (!phoneNumber || !fileName) {
      return res.status(400).json({ ok: false, error: "Faltan datos" });
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const fileUrl = `${baseUrl}/generated_pdfs/${fileName}`;

    const whatsappLink = generarWhatsappLink(
      phoneNumber,
      fileUrl,
      details || ""
    );

    res.json({
      ok: true,
      whatsappLink,
      url: fileUrl,
    });
  } catch (error) {
    console.error("❌ Error WhatsApp:", error);
    res.status(500).json({ ok: false, error: "Error generando WhatsApp" });
  }
});

module.exports = router;
