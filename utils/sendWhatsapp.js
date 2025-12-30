const generarWhatsappLink = (celular, url, details = "") => {
  if (!celular) throw new Error("El número de celular es requerido");
  if (!url) throw new Error("La URL del ticket es requerida");

  let numero = String(celular).replace(/\D/g, "");

  if (!numero.startsWith("54")) {
    numero = "54" + numero;
  }

  if (numero.length < 11) {
    throw new Error("Número inválido");
  }

  const mensaje = `Hola 👋, acá tenés tu ticket digital:\n${url}`;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
};

module.exports = generarWhatsappLink;
