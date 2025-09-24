// i18n.js - Sistema de traducciones global
document.addEventListener("DOMContentLoaded", () => {
  const translations = {
    es: {
      title: "Panel de Tickets",
      main_heading: "Panel de Envío de Tickets",
      language_label: "Idioma:",
      logout_button: "Cerrar sesión",
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
      plan_business_title: "Plan Empresarial",
      plan_business_desc: "Ideal para negocios",
      plan_business_price: "$2 USD / equipo + soporte",
      button_subscribe: "Suscribirme",
      button_contact: "Contactar",
      footer_rights: "© 2025 Tu Empresa. Todos los derechos reservados."
    },
    en: {
      title: "Tickets Panel",
      main_heading: "Ticket Sending Panel",
      language_label: "Language:",
      logout_button: "Logout",
      upload_heading: "Upload file (will convert to PDF if needed)",
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
      plan_personal_price: "First month free",
      plan_business_title: "Business Plan",
      plan_business_desc: "Ideal for businesses",
      plan_business_price: "$2 USD / device + support",
      button_subscribe: "Subscribe",
      button_contact: "Contact",
      footer_rights: "© 2025 Your Company. All rights reserved."
    },
    pt: {
      title: "Painel de Tickets",
      main_heading: "Painel de Envio de Tickets",
      language_label: "Idioma:",
      logout_button: "Sair",
      upload_heading: "Enviar arquivo (será convertido para PDF se necessário)",
      upload_button: "Enviar e Converter",
      template_heading: "Escolher Modelo",
      template_label: "Selecione um modelo predefinido:",
      template_custom_label: "Ou envie seu próprio modelo:",
      label_country: "Código do País:",
      label_phone: "WhatsApp:",
      label_email: "Email:",
      label_extra: "Detalhes Extras:",
      button_search: "Buscar Cliente",
      button_history: "Ver Histórico",
      plan_personal_title: "Plano Pessoal",
      plan_personal_desc: "Para uso individual",
      plan_personal_price: "Primeiro mês grátis",
      plan_business_title: "Plano Empresarial",
      plan_business_desc: "Ideal para negócios",
      plan_business_price: "$2 USD / dispositivo + suporte",
      button_subscribe: "Assinar",
      button_contact: "Contato",
      footer_rights: "© 2025 Sua Empresa. Todos os direitos reservados."
    }
  };

  const languageSelector = document.getElementById("language");
  let currentLang = localStorage.getItem("language") || "es";

  function applyTranslations(lang) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });
    document.title = translations[lang].title || document.title;
  }

  applyTranslations(currentLang);

  if (languageSelector) {
    languageSelector.value = currentLang;

    languageSelector.addEventListener("change", (e) => {
      const selectedLang = e.target.value;
      localStorage.setItem("language", selectedLang);
      applyTranslations(selectedLang);
    });
  }
});
