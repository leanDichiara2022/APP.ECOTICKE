const express = require("express");
const path = require("path");
const sendEmail = require("../utils/sendEmail");
const generarWhatsappLink = require("../utils/sendWhatsapp");

const router = express.Router();

// función segura para construir URL pública
function buildPublicUrl(fileName) {
  const base = process.env.BASE_URL || "https://ecoticke.com";
  return `${base}/generated_pdfs/${fileName}`;
}

// ============================
// 📧 Enviar PDF por correo
// ============================
router.post("/correo", async (req, res) => {
  try {
    const { email, fileName } = req.body;

    if (!email || !fileName) {
      return res
        .status(400)
        .json({ success: false, error: "Faltan datos para enviar el PDF" });
    }

    const fileUrl = buildPublicUrl(fileName);

    await sendEmail({
  to: email,
  subject,
  html: `
    <p>Hola,</p>
    <p>Podés descargar tu PDF desde este enlace:</p>
    <p><a href="${fileUrl}">${fileUrl}</a></p>
  `
});


    return res.status(200).json({
      success: true,
      message: "Correo enviado correctamente",
      pdfUrl: fileUrl,
    });
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    return res
      .status(500)
      .json({ success: false, error: "No se pudo enviar el correo" });
  }
});

// ============================
// 📱 Enviar solo link por WhatsApp
// ============================
router.post("/whatsapp", async (req, res) => {
  try {
    const { phoneNumber, fileName, details } = req.body;

    if (!phoneNumber || !fileName) {
      return res
        .status(400)
        .json({ success: false, error: "Faltan datos para WhatsApp" });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const fileUrl = buildPublicUrl(fileName);

    const text = `${fileUrl}\n\n${details || ""}`;

    const whatsappLink = generarWhatsappLink(cleanPhone, text);

    return res.status(200).json({
      success: true,
      whatsappLink,
      pdfUrl: fileUrl,
    });
  } catch (error) {
    console.error("❌ Error generando enlace de WhatsApp:", error);
    return res
      .status(500)
      .json({ success: false, error: "No se pudo generar el enlace" });
  }
});

module.exports = router;
