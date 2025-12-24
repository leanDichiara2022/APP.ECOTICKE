// utils/sendEmail.js
const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY no está definida en las variables de entorno");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un email simple con HTML (sin adjuntos)
 * @param {Object} params
 * @param {string|string[]} params.to - Destinatario(s)
 * @param {string} params.subject - Asunto del email
 * @param {string} params.html - Contenido HTML del email
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!to) throw new Error("El campo 'to' es obligatorio");
  if (!subject) throw new Error("El campo 'subject' es obligatorio");
  if (!html) throw new Error("El campo 'html' es obligatorio");

  try {
    const response = await resend.emails.send({
      from: "EcoTicke <no-reply@ecoticke.com>",
      to,
      subject,
      html,
    });

    console.log("📧 Email enviado correctamente:", response?.id || response);
    return response;
  } catch (error) {
    console.error("❌ Error enviando email:", error?.message || error);

    // Propaga error para manejar en servicios superiores
    throw new Error("No se pudo enviar el email. Revisa el log para más detalles.");
  }
};

module.exports = sendEmail;
