document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // Traducciones
  // -------------------------------
  const languageSelector = document.getElementById("language");
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
      logout_button: "Log Out",
      upload_heading: "Upload File (converted to PDF if necessary)",
      upload_button: "Upload & Convert",
      template_heading: "Select Template",
      template_label: "Choose a predefined template:",
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
      upload_heading: "Enviar arquivo (convertido para PDF se necessário)",
      upload_button: "Enviar e Converter",
      template_heading: "Escolher Modelo",
      template_label: "Escolha um modelo pré-definido:",
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
      plan_business_desc: "Ideal para empresas",
      plan_business_price: "$2 USD / dispositivo + suporte",
      button_subscribe: "Assinar",
      button_contact: "Contactar",
      footer_rights: "© 2025 Sua Empresa. Todos os direitos reservados."
    }
  };

  function applyTranslations(lang) {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });
  }

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
      .catch(() => alert("Error logging out"));
  };

  // -------------------------------
  // Toasts
  // -------------------------------
  function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer") || document.body;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "10px 15px";
    toast.style.borderRadius = "5px";
    toast.style.color = "#fff";
    toast.style.background = type === "success" ? "#27ae60" : "#c0392b";
    toast.style.zIndex = 9999;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // -------------------------------
  // Formulario de Subida de Archivo
  // -------------------------------
  let archivoSubido = null;
  const uploadForm = document.getElementById("pdfForm");
  const archivoInput = document.getElementById("archivo");

  const countrySel = document.getElementById("countryCode");
  const phoneInput = document.getElementById("phoneNumber");
  const detailsInput = document.getElementById("extraDetails");
  const emailInput = document.getElementById("email");

  const whatsappBtn = document.getElementById("sendWhatsappBtn");
  const emailBtn = document.getElementById("sendEmailBtn");

  const tableBody = document.getElementById("ticketHistoryTable");
  const plantillaSelect = document.getElementById("templateSelect");

  const searchClientBtn = document.getElementById("searchClient");

  const setARPlaceholder = () => { if (phoneInput) phoneInput.placeholder = "Ej: 2392 538059 (sin +54 ni 9)"; };
  const setDefaultPlaceholder = () => { if (phoneInput) phoneInput.placeholder = "Ingresá tu número (sin código de país)"; };
  const applyCountryUX = () => {
    const cc = countrySel ? countrySel.value : "+54";
    if (cc === "+54") setARPlaceholder();
    else setDefaultPlaceholder();
  };
  const normalizeLocalNumber = (countryCode, inputValue) => {
    let digits = (inputValue || "").replace(/\D/g, "");
    if (countryCode === "+54") {
      if (digits.startsWith("0")) digits = digits.slice(1);
      digits = digits.replace(/^(\d{2,5})15(\d+)/, "$1$2");
    }
    return digits;
  };
  const resetFormulario = () => {
    if (archivoInput) archivoInput.value = "";
    if (countrySel) countrySel.value = "+54";
    applyCountryUX();
    if (phoneInput) phoneInput.value = "";
    if (detailsInput) detailsInput.value = "";
    if (emailInput) emailInput.value = "";
    archivoSubido = null;
  };

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const archivo = archivoInput.files[0];
      if (!archivo) { showToast("⚠️ Tenés que seleccionar un archivo.", "error"); return; }

      const formData = new FormData();
      formData.append("archivo", archivo);

      try {
        const response = await fetch("/api/pdf/upload", { method: "POST", body: formData });
        const data = await response.json();
        if (response.ok) {
          archivoSubido = data.fileName || data.nombreArchivo || null;
          const pdfUrl = data.url || data.pdfUrl || `/generated_pdfs/${archivoSubido}`;
          showToast("✅ Archivo procesado correctamente", "success");
          if (pdfUrl) openPDFInModal(pdfUrl);
        } else {
          showToast("❌ Error: " + (data.error || "No se pudo procesar el archivo."), "error");
        }
      } catch (err) { console.error(err); showToast("❌ Error al enviar el archivo.", "error"); }
    });
  }

  if (countrySel) { applyCountryUX(); countrySel.addEventListener("change", applyCountryUX); }

  // -------------------------------
  // Enviar WhatsApp
  // -------------------------------
  whatsappBtn?.addEventListener("click", async () => {
    if (!archivoSubido) { showToast("⚠️ Primero subí un archivo.", "error"); return; }
    const countryCode = countrySel ? countrySel.value : "+54";
    const rawPhone = phoneInput ? phoneInput.value : "";
    const details = detailsInput ? detailsInput.value : "";
    if (!rawPhone.trim()) { showToast("⚠️ Ingresá un número válido.", "error"); return; }
    const localNumber = normalizeLocalNumber(countryCode, rawPhone);
    if (!localNumber) { showToast("⚠️ Número inválido.", "error"); return; }
    const internationalNoPlus = countryCode.replace(/\+/g, "") + localNumber;
    try {
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: internationalNoPlus, fileName: archivoSubido, details }),
      });
      const data = await response.json();
      if (response.ok && data.whatsappLink) {
        window.open(data.whatsappLink, "_blank");
        showToast("✅ Enlace de WhatsApp generado", "success");
        resetFormulario();
      } else {
        const pdfUrl = data.pdfUrl || `/generated_pdfs/${archivoSubido}`;
        const manualMsg = `📄 Aquí está tu archivo PDF: ${pdfUrl}\n\n📋 Detalles: ${details || "Sin detalles adicionales"}`;
        const waLink = `https://wa.me/${internationalNoPlus}?text=${encodeURIComponent(manualMsg)}`;
        window.open(waLink, "_blank");
        showToast("✅ Enlace generado manualmente", "success");
        resetFormulario();
      }
    } catch (err) { console.error(err); showToast("❌ Error al enviar por WhatsApp.", "error"); }
  });

  // -------------------------------
  // Enviar Correo
  // -------------------------------
  emailBtn?.addEventListener("click", async () => {
    if (!archivoSubido) { showToast("⚠️ Primero subí un archivo.", "error"); return; }
    const email = emailInput ? emailInput.value : "";
    if (!email.trim()) { showToast("⚠️ Ingresá un correo válido.", "error"); return; }
    try {
      const response = await fetch("/api/correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fileName: archivoSubido }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast("✅ Correo enviado correctamente.", "success");
        resetFormulario();
      } else {
        showToast("❌ Error al enviar correo: " + (data.error || "Desconocido"), "error");
      }
    } catch (err) { console.error(err); showToast("❌ Error al enviar correo.", "error"); }
  });

  // -------------------------------
  // Historial Tickets
  // -------------------------------
  async function fetchHistory() {
    if (!tableBody) return;
    try {
      const response = await fetch("/api/history/data");
      if (!response.ok) throw new Error("Error en la respuesta del servidor");
      const history = await response.json();
      renderHistoryTable(history);
    } catch (error) { console.error(error); showToast("❌ Error al cargar historial", "error"); }
  }

  function renderHistoryTable(history) {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    if (!history || history.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='4'>No hay tickets en el historial.</td></tr>";
      return;
    }
    history.forEach(ticket => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(ticket.createdAt).toLocaleDateString()}</td>
        <td>${ticket.email || ticket.celular || "Sin datos"}</td>
        <td>${ticket.estado}</td>
        <td>
          <a href="${ticket.url}" target="_blank" class="btn-link">Ver</a>
          <a href="${ticket.url}" download class="btn-link">Descargar</a>
          <button class="btn-primary" onclick="resendTicket('${ticket._id}')">Reenviar</button>
          <button class="btn-danger" onclick="confirmDeleteTicket('${ticket._id}')">Eliminar</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  window.resendTicket = async id => {
    try {
      const response = await fetch(`/api/history/resend
