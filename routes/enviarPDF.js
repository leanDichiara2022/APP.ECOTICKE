const express = require("express");
const sendEmail = require("../utils/sendEmail");
const generarWhatsappLink = require("../utils/sendWhatsapp");

const router = express.Router();

function buildPublicUrl(fileName) {
  const base = process.env.BASE_URL || "https://ecoticke.com";
  return `${base}/generated_pdfs/${fileName}`;
}

// ========================
//  📧 EMAIL
// ========================
router.post("/correo", async (req, res) => {
  try {
    const { email, fileName } = req.body;

    if (!email || !fileName) {
      return res.status(400).json({ success: false, error: "Faltan datos" });
    }

    const fileUrl = buildPublicUrl(fileName);

    await sendEmail({
      to: email,
      subject: "Tu archivo",
      html: `
        <p>Hola 👋</p>
        <p>Podés ver tu archivo acá:</p>
        <p><a href="${fileUrl}">${fileUrl}</a></p>
      `
    });

    console.log("Enviaríamos email con link:", email, fileUrl);

    return res.json({ success: true, pdfUrl: fileUrl });

  } catch (err) {
    console.error("Error correo:", err);
    return res.status(500).json({ success: false, error: "No se pudo enviar correo" });
  }
});

// ========================
//  📱 WHATSAPP
// ========================
router.post("/whatsapp", async (req, res) => {
  try {
    const { phoneNumber, phone, fileName, details } = req.body;

    const number = phoneNumber || phone;

    if (!number || !fileName) {
      return res.status(400).json({ success: false, error: "Faltan datos" });
    }

    const cleanPhone = number.replace(/\D/g, "");
    const fileUrl = buildPublicUrl(fileName);

    const text = `${fileUrl}\n\n${details || ""}`;

    const whatsappLink = generarWhatsappLink(cleanPhone, text);

    return res.json({
      success: true,
      whatsappLink,
      pdfUrl: fileUrl,
    });

  } catch (err) {
    console.error("Error WhatsApp:", err);
    return res.status(500).json({ success: false, error: "No se pudo generar el enlace" });
  }
});

module.exports = router;
