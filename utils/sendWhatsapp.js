// utils/sendWhatsapp.js

/**
 * Genera un link de WhatsApp con mensaje prellenado
 * @param {string} celular - Número en formato internacional (ej: 5491122334455)
 * @param {string} url - URL pública del archivo
 * @param {string} details - Detalles opcionales
 * @returns {string} URL lista para abrir en WhatsApp
 */
const generarWhatsappLink = (celular, url, details = "") => {
  if (!celular) {
    throw new Error("El número de celular es requerido");
  }

  if (!url) {
    throw new Error("La URL del ticket es requerida");
  }

  let numero = String(celular).replace(/\D/g, "");

  if (numero.length < 10) {
    throw new Error("El número de celular no parece válido");
  }

  let mensaje = `Hola 👋, acá tenés tu ticket digital:\n${url}`;

  if (details && details.trim()) {
    mensaje += `\n\n📋 Detalles:\n${details.trim()}`;
  }

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
};

module.exports = generarWhatsappLink;
