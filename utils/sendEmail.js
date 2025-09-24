const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev", // configurá esto en Resend
      to,
      subject,
      html,
    });

    console.log("📧 Correo enviado con Resend:", response.id || response);
    return response;
  } catch (error) {
    console.error("❌ Error en sendEmail (Resend):", error);
    throw error;
  }
};

module.exports = sendEmail;
