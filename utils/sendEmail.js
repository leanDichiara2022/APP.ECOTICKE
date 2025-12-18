// utils/sendEmail.js
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un email simple con HTML (sin adjuntos)
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await resend.emails.send({
      from: "EcoTicke <no-reply@ecoticke.com>",
      to,
      subject,
      html,
    });

    console.log("📧 Email enviado:", response.id || response);
    return response;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    throw error;
  }
};

module.exports = sendEmail;
