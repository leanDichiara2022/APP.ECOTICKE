document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // Traducciones
  // -------------------------------
  const languageSelector = document.getElementById("language");
  const translations = {
    es: {
      title: "Panel de Tickets",
      main_heading: "Panel de Envío de Tickets",
      logout_button: "Cerrar sesión",
      language_label: "Idioma:",
      upload_heading: "Subir archivo (se convierte a PDF si es necesario)",
      upload_button: "Subir y convertir",
      template_heading: "Elegir Plantilla",
      template_label: "Selecciona una plantilla predefinida:",
      template_custom_label: "O subir tu propia plantilla:",
      label_country: "Código País:",
      label_phone: "WhatsApp:",
      label_email: "Correo Electrónico:",
      label_extra: "Detalles Extra:",
      button_search: "Buscar Cliente",
      button_history: "Ver Historial",
      plan_personal_title: "Plan Personal",
      plan_personal_desc: "Para uso individual",
      plan_personal_price: "Gratis el primer mes",
      button_subscribe: "Suscribirme",
      plan_business_title: "Plan Empresarial",
      plan_business_desc: "Ideal para negocios",
      plan_business_price: "$2 USD / equipo + soporte",
      button_contact: "Contactar",
      footer_rights: "© 2025 Tu Empresa. Todos los derechos reservados."
    },
    en: {
      title: "Tickets Panel",
      main_heading: "Ticket Sending Panel",
      logout_button: "Log Out",
      language_label: "Language:",
      upload_heading: "Upload File (will convert to PDF if necessary)",
      upload_button: "Upload & Convert",
      template_heading: "Choose Template",
      template_label: "Select a predefined template:",
      template_custom_label: "Or upload your own template:",
      label_country: "Country Code:",
      label_phone: "WhatsApp:",
      label_email: "Email:",
      label_extra: "Extra Details:",
      button_search: "Search Client",
      button_history: "View History",
      plan_personal_title: "Personal Plan",
      plan_personal_desc: "For individual use",
      plan_personal_price: "Free first month",
      button_subscribe: "Subscribe",
      plan_business_title: "Business Plan",
      plan_business_desc: "Ideal for businesses",
      plan_business_price: "$2 USD / device + support",
      button_contact: "Contact",
      footer_rights: "© 2025 Your Company. All rights reserved."
    },
    pt: {
      title: "Painel de Tickets",
      main_heading: "Painel de Envio de Tickets",
      logout_button: "Sair",
      language_label: "Idioma:",
      upload_heading: "Enviar Arquivo (será convertido em PDF se necessário)",
      upload_button: "Enviar & Converter",
      template_heading: "Escolher Modelo",
      template_label: "Selecione um modelo pré-definido:",
      template_custom_label: "Ou envie seu próprio modelo:",
      label_country: "Código do País:",
      label_phone: "WhatsApp:",
      label_email: "Email:",
      label_extra: "Detalhes Extras:",
      button_search: "Buscar Cliente",
      button_history: "Ver Histórico",
      plan_personal_title: "Plano Pessoal",
      plan_personal_desc: "Para uso individual",
      plan_personal_price: "Grátis no primeiro mês",
      button_subscribe: "Assinar",
      plan_business_title: "Plano Empresarial",
      plan_business_desc: "Ideal para negócios",
      plan_business_price: "$2 USD / dispositivo + suporte",
      button_contact: "Contato",
      footer_rights: "© 2025 Sua Empresa. Todos os direitos reservados."
    }
  };

  function applyTranslations(lang) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const text = translations[lang]?.[key];
      if (!text) return;

      // Si el elemento es input o textarea → placeholder
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = text;
      }
      // Si el elemento es un botón → textContent
      else if (el.tagName === "BUTTON" || el.tagName === "OPTION") {
        el.textContent = text;
      }
      else {
        el.textContent = text;
      }
    });

    // Cambiar título de la página
    if (translations[lang]?.title) document.title = translations[lang].title;
  }

  // Aplicar idioma guardado
  let currentLanguage = localStorage.getItem("language") || "es";
  applyTranslations(currentLanguage);
  if (languageSelector) languageSelector.value = currentLanguage;

  languageSelector?.addEventListener("change", () => {
    currentLanguage = languageSelector.value;
    localStorage.setItem("language", currentLanguage);
    applyTranslations(currentLanguage);
  });

  // -------------------------------
  // Logout
  // -------------------------------
  window.logout = () => {
    fetch("/api/logout", { method: "POST" })
      .then(() => { window.location.href = "/login.html"; })
      .catch(err => { console.error(err); alert("Error al cerrar sesión"); });
  };

  // -------------------------------
  // Buscar cliente
  // -------------------------------
  const searchClientBtn = document.getElementById("searchClient");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phoneNumber");

  searchClientBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = emailInput?.value.trim();
    const phone = phoneInput?.value.trim();
    if (!email && !phone) { alert("⚠️ Ingresá email o WhatsApp del cliente"); return; }

    try {
      const query = new URLSearchParams();
      if (email) query.append("email", email);
      if (phone) query.append("phone", phone);

      const response = await fetch(`/api/clients/search?${query.toString()}`);
      const data = await response.json();
      if (response.ok && data.client) {
        alert(`✅ Cliente encontrado: ${data.client.name || "Sin nombre"}`);
        if (data.client.email) emailInput.value = data.client.email;
        if (data.client.celular) phoneInput.value = data.client.celular;
      } else {
        alert("❌ Cliente no encontrado");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error al buscar cliente");
    }
  });

  // -------------------------------
  // Botón Suscribirme
  // -------------------------------
  const subscribeBtn = document.querySelector("[data-i18n='button_subscribe']");
  subscribeBtn?.addEventListener("click", () => {
    window.location.href = "/planes.html";
  });

  // -------------------------------
  // Botón Contactar
  // -------------------------------
  const contactBtn = document.querySelector("[data-i18n='button_contact']");
  contactBtn?.addEventListener("click", () => {
    window.location.href = "/planes.html";
  });
});
