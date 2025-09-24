// utils/sendWhatsapp.js

/**
 * Genera un link de WhatsApp con un mensaje prellenado
 * @param {string} celular - Número del destinatario en formato internacional (ej: 5491122334455)
 * @param {string} pdfUrl - URL pública del PDF generado
 * @returns {string} - Link para abrir WhatsApp con el mensaje
 */
const generarWhatsappLink = (celular, pdfUrl, details = "") => {
  let mensaje = `Hola 👋, aquí tenés tu ticket: ${pdfUrl}`;
  if (details) mensaje += `\n\n📋 Detalles: ${details}`;
  return `https://wa.me/${celular}?text=${encodeURIComponent(mensaje)}`;
};

module.exports = generarWhatsappLink;
