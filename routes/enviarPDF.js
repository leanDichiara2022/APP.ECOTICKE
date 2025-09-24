const express = require("express");
const path = require("path");
const sendEmail = require("../utils/sendEmail");
const generarWhatsappLink = require("../utils/sendWhatsapp");

const router = express.Router();

// 📬 Enviar PDF por correo
router.post("/correo", async (req, res) => {
  try {
    const { email, fileName } = req.body;
    if (!email || !fileName) {
      return res.status(400).json({ success: false, error: "Faltan datos para enviar el PDF" });
    }

    const filePath = path.join(__dirname, "../generated_pdfs", fileName);
    const fileUrl = `${process.env.BASE_URL || "http://localhost:3000"}/generated_pdfs/${fileName}`;

    const subject = "Tu archivo PDF";
    const html = `
      <p>Hola,</p>
      <p>Adjunto tu archivo PDF. También podés <a href="${fileUrl}">verlo o descargarlo aquí</a>.</p>
    `;

    await sendEmail({
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: fileName,
          path: filePath
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Correo enviado exitosamente",
      pdfUrl: fileUrl
    });
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

// 📱 Enviar PDF por WhatsApp (solo link)
router.post("/whatsapp", async (req, res) => {
  try {
    const { phoneNumber, fileName, details, countryCode } = req.body;

    if (!phoneNumber || !fileName) {
      return res.status(400).json({ success: false, error: "Faltan datos para WhatsApp" });
    }

    // 🔹 Normalizar número con código de país
    let finalNumber = phoneNumber;
    if (countryCode === "+54") {
      // Para Argentina → siempre "549" + número
      finalNumber = "549" + phoneNumber.replace(/\D/g, "");
    } else if (countryCode) {
      // Otros países → quitar símbolos y anteponer código
      finalNumber = countryCode.replace(/\D/g, "") + phoneNumber.replace(/\D/g, "");
    }

    // Generar URL del PDF
    const fileUrl = `${process.env.BASE_URL || "http://localhost:3000"}/generated_pdfs/${fileName}`;

    // Generar link de WhatsApp con mensaje prellenado
    const whatsappLink = generarWhatsappLink(
      finalNumber,
      `${fileUrl}\n\n📋 Detalles: ${details || "Sin detalles adicionales"}`
    );

    res.status(200).json({
      success: true,
      message: "Link de WhatsApp generado correctamente",
      whatsappLink,
      pdfUrl: fileUrl
    });
  } catch (error) {
    console.error("❌ Error generando link de WhatsApp:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

module.exports = router;
