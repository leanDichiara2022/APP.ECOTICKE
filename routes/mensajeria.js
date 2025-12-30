const express = require("express");
const path = require("path");

const router = express.Router();

// carpeta pública donde ya se generan PDFs / archivos
const publicDir = path.join(__dirname, "../public");

router.post("/whatsapp", async (req, res) => {
  try {
    const { phoneNumber, fileName } = req.body;

    if (!phoneNumber || !fileName) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const fileUrl = `/generated_pdfs/${fileName}`;

    const whatsappLink =
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        `Hola, acá tenés tu archivo:\n${process.env.BASE_URL || ""}${fileUrl}`
      )}`;

    return res.json({ ok: true, whatsappLink, fileUrl });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error generando link de WhatsApp" });
  }
});

router.post("/correo", async (req, res) => {
  try {
    const { email, fileName } = req.body;

    if (!email || !fileName) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const fileUrl = `${process.env.BASE_URL || ""}/generated_pdfs/${fileName}`;

    // 👉 acá después se conecta RESEND
    console.log("Enviaríamos email con link:", email, fileUrl);

    return res.json({
      ok: true,
      message: "Simulado envío de correo",
      fileUrl,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error enviando correo" });
  }
});

module.exports = router;
