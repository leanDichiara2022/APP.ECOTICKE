const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY no está definida");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const result = await resend.emails.send({
      from: "EcoTicke <no-reply@ecoticke.com>",
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error("❌ Error Resend:", result.error);
      throw new Error(result.error.message || "Error en Resend");
    }

    return result;
  } catch (err) {
    console.error("❌ Error enviando email:", err);
    throw err;
  }
};

module.exports = sendEmail;
