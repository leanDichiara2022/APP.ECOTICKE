const express = require("express");
const path = require("path");
const multer = require("multer");

const sendEmail = require("../utils/sendEmail");
const generarWhatsappLink = require("../utils/sendWhatsapp");

const router = express.Router();

// aceptar multipart/form-data
const upload = multer();

// función segura para construir URL pública
function buildPublicUrl(fileName) {
  const base = process.env.BASE_URL || "https://ecoticke.com";
  return `${base}/generated_pdfs/${fileName}`;
}

/*
 FRONTEND ENVÍA ESTO:

 fd.append('archivo', file);
 fd.append('filename', file.name);
 fd.append('phone', phone);
 fd.append('email', email);
 fd.append('extra', extraDetails);

*/

// ======================================
// 📧 ENVIAR EMAIL SOLO CON LINK
// ======================================
router.post("/send/email", upload.none(), async (req, res) => {
  try {
    const { email, filename } = req.body;

    if (!email || !filename) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos para enviar email",
      });
    }

    const fileUrl = buildPublicUrl(filename);

    console.log("🔗 Enviaríamos email con link:", email, fileUrl);

    await sendEmail({
      to: email,
      subject: "Tu ticket",
      html: `
        <p>Hola 👋</p>
        <p>Podés ver tu archivo acá:</p>
        <p><a href="${fileUrl}">${fileUrl}</a></p>
      `,
    });

    return res.json({
      success: true,
      pdfUrl: fileUrl,
    });
  } catch (e) {
    console.error("EMAIL ERROR", e);
    return res.status(500).json({ success: false });
  }
});

// ======================================
// 📱 ENVIAR WHATSAPP SOLO CON LINK
// ======================================
router.post("/send/whatsapp", upload.none(), async (req, res) => {
  try {
    const { phone, filename, extra } = req.body;

    if (!phone || !filename) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos para WhatsApp",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "");

    const fileUrl = buildPublicUrl(filename);

    const text = `${fileUrl}\n\n${extra || ""}`;

    const whatsappLink = generarWhatsappLink(cleanPhone, text);

    return res.json({
      success: true,
      whatsappLink,
      pdfUrl: fileUrl,
    });
  } catch (e) {
    console.error("WHATSAPP ERROR", e);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
