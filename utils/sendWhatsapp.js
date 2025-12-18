// utils/sendWhatsapp.js

/**
 * Genera un link de WhatsApp con mensaje prellenado
 * @param {string} celular - Número en formato internacional (ej: 5491122334455)
 * @param {string} url - URL pública del archivo
 * @param {string} details - Detalles opcionales
 */
const generarWhatsappLink = (celular, url, details = "") => {
  let mensaje = `Hola 👋, acá tenés tu ticket digital:\n${url}`;
  if (details) {
    mensaje += `\n\n📋 Detalles:\n${details}`;
  }

  return `https://wa.me/${celular}?text=${encodeURIComponent(mensaje)}`;
};

module.exports = generarWhatsappLink;
