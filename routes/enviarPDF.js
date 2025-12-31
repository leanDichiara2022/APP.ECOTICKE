const express = require("express");
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

// ======================================
// Normaliza nombres (filename / fileName / pdfName…)
// ======================================
function normalizeBody(body) {
  return {
    email:
      body.email ||
      body.correo ||
      body.mail ||
      null,

    phone:
      body.phone ||
      body.phoneNumber ||
      body.telefono ||
      null,

    filename:
      body.filename ||
      body.fileName ||
      body.pdfName ||
      body.name ||
      null,

    extra:
      body.extra ||
      body.details ||
      body.mensaje ||
      "",
  };
}

/* -------------------------------------
    EMAIL – RUTA NUEVA y VIEJA
------------------------------------- */

// nueva
router.post("/send/email", upload.none(), async (req, res) => {
  return handleEmail(req, res);
});

// compatibilidad con frontend viejo
router.post("/correo", upload.none(), async (req, res) => {
  return handleEmail(req, res);
});

/* -------------------------------------
    WHATSAPP – RUTA NUEVA y VIEJA
------------------------------------- */

// nueva
router.post("/send/whatsapp", upload.none(), async (req, res) => {
  return handleWhatsapp(req, res);
});

// compatibilidad con frontend viejo
router.post("/whatsapp", upload.none(), async (req, res) => {
  return handleWhatsapp(req, res);
});

/* -------------------------------------
    IMPLEMENTACIÓN REAL
------------------------------------- */

async function handleEmail(req, res) {
  try {
    const data = normalizeBody(req.body);

    if (!data.email || !data.filename) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos para enviar email",
      });
    }

    const fileUrl = buildPublicUrl(data.filename);

    await sendEmail({
      to: data.email,
      subject: "Tu archivo",
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
}

async function handleWhatsapp(req, res) {
  try {
    const data = normalizeBody(req.body);

    if (!data.phone || !data.filename) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos para WhatsApp",
      });
    }

    const cleanPhone = data.phone.replace(/\D/g, "");

    const fileUrl = buildPublicUrl(data.filename);

    const text = `${fileUrl}\n\n${data.extra || ""}`;

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
}

module.exports = router;
