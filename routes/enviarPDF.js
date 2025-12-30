const express = require("express");
const multer = require("multer");
const sendEmail = require("../utils/sendEmail");
const generarWhatsappLink = require("../utils/sendWhatsapp");

const router = express.Router();

// 👉 permite leer multipart/form-data SIN archivos
const upload = multer();

// URL pública segura
function buildPublicUrl(fileName) {
  const base = process.env.BASE_URL || "https://ecoticke.com";
  return `${base}/generated_pdfs/${fileName}`;
}

/**
 * ============================
 * 📧 ENVIAR LINK POR EMAIL
 * endpoint real:
 *      POST /api/send/email
 * ============================
 */
router.post("/email", upload.none(), async (req, res) => {
  try {
    const { email, fileName } = req.body;

    if (!email || !fileName) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos para enviar el correo",
      });
    }

    const fileUrl = buildPublicUrl(fileName);

    await sendEmail({
      to: email,
      subject: "Tu archivo solicitado",
      html: `
        <p>Hola,</p>
        <p>Puedes descargar tu archivo desde este enlace:</p>
        <p><a href="${fileUrl}">${fileUrl}</a></p>
        <p>El enlace permite abrir <strong>PDF, imágenes o cualquier archivo enviado</strong>.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Correo enviado correctamente",
      pdfUrl: fileUrl,
    });
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    return res.status(500).json({
      success: false,
      error: "No se pudo enviar el correo",
    });
  }
});

/**
 * ============================
 * 📱 ENVIAR LINK POR WHATSAPP
 * endpoint real:
 *      POST /api/send/whatsapp
 * ============================
 */
router.post("/whatsapp", upload.none(), async (req, res) => {
  try {
    const { phoneNumber, fileName, details } = req.body;

    if (!phoneNumber || !fileName) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos para WhatsApp",
      });
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
    return res.status(500).json({
      success: false,
      error: "No se pudo generar el enlace",
    });
  }
});

module.exports = router;
