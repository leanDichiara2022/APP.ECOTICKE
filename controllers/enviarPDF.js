const path = require("path");
const fs = require("fs");
const PDFRegistro = require("../models/pdfRegistro");
const History = require("../models/history");
const sendEmail = require("../utils/sendEmail");
const generarWhatsappLink = require("../utils/sendWhatsapp");

// 🔥 BASE_URL correcta (VPS o dominio)
// ejemplo: http://TU-IP:3000  o  https://tudominio.com
const BASE_URL =
  process.env.BASE_URL ||
  process.env.PUBLIC_URL ||
  "http://TU_IP_DEL_VPS:3000";

// Generar PDF y enviar por email/whatsapp link
const generarPDF = async (req, res) => {
  try {
    const { email, celular } = req.body;

    const pdfFileName = `ticket_${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, "../generated_pdfs", pdfFileName);

    // TODO: acá va generación real del PDF
    fs.writeFileSync(pdfPath, "Contenido de prueba del PDF...");

    // 🚫 NO MÁS LOCALHOST
    const pdfUrl = `${BASE_URL}/generated_pdfs/${pdfFileName}`;

    if (email) {
      await sendEmail({
        to: email,
        subject: "Tu ticket PDF",
        html: `
          <p>Hola 👋, acá tenés tu ticket digital:</p>
          <p><a href="${pdfUrl}">Descargar ticket</a></p>
          <p>Si no abre, copiá este link:</p>
          <p>${pdfUrl}</p>
        `,
      });
    }

    let whatsappLink = null;

    if (celular) {
      whatsappLink = generarWhatsappLink(celular, pdfUrl);
    }

    await History.create({
      ticketId: pdfFileName,
      estado: "Enviado",
      fecha: new Date(),
    });

    res.json({
      success: true,
      message: "PDF generado correctamente",
      pdfUrl,
      whatsappLink,
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).json({ success: false, error: "Error al generar PDF" });
  }
};

module.exports = { generarPDF };
