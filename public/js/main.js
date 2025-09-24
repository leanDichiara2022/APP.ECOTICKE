// public/js/main.js
document.addEventListener("DOMContentLoaded", () => {
  const sendWhatsappBtn = document.getElementById("sendWhatsappBtn");
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  const searchClientBtn = document.getElementById("searchClient");
  const phoneInput = document.getElementById("phoneNumber");
  const emailInput = document.getElementById("email");
  const detailsInput = document.getElementById("extraDetails");

  // =====================================================
  // 📱 Enviar por WhatsApp
  // =====================================================
  sendWhatsappBtn && sendWhatsappBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const countryCode = document.getElementById("countryCode").value;
    const phone = phoneInput.value.trim();
    const details = detailsInput.value;
    const fileName = localStorage.getItem("lastUploadedFile");

    if (!phone || !fileName) {
      showToast("⚠️ Debes ingresar un número y subir un archivo primero.", "error");
      return;
    }

    const phoneNumber = countryCode.replace("+", "") + phone;

    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, fileName, details }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("📲 Enlace de WhatsApp generado con éxito", "success");
        localStorage.setItem("lastSentContact", JSON.stringify({
          phone, email: emailInput.value, details, fileName
        }));
      } else {
        showToast("❌ Error al generar el link de WhatsApp", "error");
      }
      if (data.whatsappLink) window.open(data.whatsappLink, "_blank");
    } catch (error) {
      console.error("Error enviando WhatsApp:", error);
      showToast("❌ No se pudo enviar por WhatsApp", "error");
    }
  });

  // =====================================================
  // 📧 Enviar por Email
  // =====================================================
  sendEmailBtn && sendEmailBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const fileName = localStorage.getItem("lastUploadedFile");

    if (!email || !fileName) {
      showToast("⚠️ Debes ingresar un correo y subir un archivo primero.", "error");
      return;
    }

    try {
      const res = await fetch("/api/correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fileName }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("📧 Correo enviado con éxito!", "success");
        localStorage.setItem("lastSentContact", JSON.stringify({
          phone: phoneInput.value, email, details: detailsInput.value, fileName
        }));
      } else {
        showToast("❌ Error al enviar correo: " + (data.error || ""), "error");
      }
    } catch (error) {
      console.error("Error enviando correo:", error);
      showToast("❌ No se pudo enviar por correo", "error");
    }
  });

  // =====================================================
  // 🔎 Buscar Cliente
  // =====================================================
  const searchResultsContainer = document.createElement("div");
  searchResultsContainer.id = "searchResultsContainer";
  Object.assign(searchResultsContainer.style, {
    position: "absolute",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    maxHeight: "200px",
    overflowY: "auto",
    width: "250px",
    display: "none",
    zIndex: "1000"
  });
  document.body.appendChild(searchResultsContainer);

  function positionResultsContainer(input) {
    const rect = input.getBoundingClientRect();
    searchResultsContainer.style.top = rect.bottom + window.scrollY + "px";
    searchResultsContainer.style.left = rect.left + window.scrollX + "px";
    searchResultsContainer.style.width = rect.width + "px";
  }

  async function searchClients(query) {
    try {
      const res = await fetch(`/api/contacts/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data.contacts || [];
    } catch (error) {
      console.error("Error buscando cliente:", error);
      return [];
    }
  }

  function showResults(contacts, input) {
    if (!contacts.length) {
      searchResultsContainer.style.display = "none";
      return;
    }

    searchResultsContainer.innerHTML = "";
    contacts.forEach(contact => {
      const item = document.createElement("div");
      Object.assign(item.style, {
        padding: "8px",
        cursor: "pointer",
        borderBottom: "1px solid #eee"
      });
      item.innerText = `${contact.name || "Sin Nombre"} - ${contact.phone || "-"} - ${contact.email || "-"}`;
      item.addEventListener("click", () => {
        phoneInput.value = contact.phone || "";
        emailInput.value = contact.email || "";
        detailsInput.value = contact.extraDetails || "";
        searchResultsContainer.style.display = "none";
        showToast(`✅ Contacto seleccionado: ${contact.name || "Desconocido"}`, "success");
      });
      searchResultsContainer.appendChild(item);
    });

    positionResultsContainer(input);
    searchResultsContainer.style.display = "block";
  }

  [phoneInput, emailInput].forEach(input => {
    if (!input) return;
    input.addEventListener("input", async () => {
      const query = input.value.trim();
      if (!query) {
        searchResultsContainer.style.display = "none";
        return;
      }
      const contacts = await searchClients(query);
      showResults(contacts, input);
    });
  });

  searchClientBtn && searchClientBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const query = phoneInput.value.trim() || emailInput.value.trim();
    if (!query) {
      showToast("⚠️ Ingresa un teléfono o correo para buscar.", "error");
      return;
    }
    const contacts = await searchClients(query);
    showResults(contacts, phoneInput);
  });

  document.addEventListener("click", (e) => {
    if (!searchResultsContainer.contains(e.target) &&
        e.target !== searchClientBtn &&
        e.target !== phoneInput &&
        e.target !== emailInput) {
      searchResultsContainer.style.display = "none";
    }
  });

  // =====================================================
  // 📑 Plantillas con vista previa
  // =====================================================
  const templateSelect = document.getElementById("templateSelect");
  const customTemplateInput = document.getElementById("customTemplate");
  const previewBtn = document.getElementById("previewTemplateBtn");
  const templatePreview = document.getElementById("templatePreview");
  const usuarioId = localStorage.getItem("usuarioId");

  function showTemplatePreview(plantilla) {
    if (!templatePreview) return;
    templatePreview.classList.remove("hidden");
    const url = `/templates/preview/${encodeURIComponent(plantilla)}`;
    templatePreview.innerHTML = `<iframe src="${url}" style="width:100%;height:480px;border:1px solid #ccc;border-radius:6px;"></iframe>`;
  }

  if (templateSelect) {
    templateSelect.addEventListener("change", async () => {
      showTemplatePreview(templateSelect.value);
      try {
        const res = await fetch("/api/templates/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuarioId, plantilla: templateSelect.value }),
        });
        const data = await res.json();
        if (data.success) showToast(`✅ Plantilla "${templateSelect.value}" guardada`, "success");
        else showToast("❌ Error al guardar plantilla", "error");
      } catch (error) {
        console.error("Error guardando plantilla:", error);
        showToast("❌ No se pudo guardar la plantilla", "error");
      }
    });
  }

  if (customTemplateInput) {
    customTemplateInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      templatePreview.classList.remove("hidden");
      const reader = new FileReader();

      if (file.type === "application/pdf") {
        reader.onload = ev => templatePreview.innerHTML = `<iframe src="${ev.target.result}" style="width:100%;height:480px;border:1px solid #ccc;border-radius:6px;"></iframe>`;
        reader.readAsDataURL(file);
      } else if (file.type === "text/html") {
        reader.onload = ev => templatePreview.innerHTML = `<iframe srcdoc="${ev.target.result}" style="width:100%;height:480px;border:1px solid #ccc;border-radius:6px;"></iframe>`;
        reader.readAsText(file);
      } else {
        templatePreview.innerHTML = `<p>📂 Plantilla cargada: ${file.name} ✔</p>`;
      }

      const formData = new FormData();
      formData.append("plantilla", file);
      formData.append("usuarioId", usuarioId);

      try {
        const res = await fetch("/api/pdf/upload-template", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) showToast("✅ Plantilla personalizada subida con éxito", "success");
        else showToast("❌ Error al subir plantilla personalizada", "error");
      } catch (error) {
        console.error("Error subiendo plantilla personalizada:", error);
        showToast("❌ No se pudo subir la plantilla", "error");
      }
    });
  }

  previewBtn && previewBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (customTemplateInput && customTemplateInput.files && customTemplateInput.files.length > 0) {
      const file = customTemplateInput.files[0];
      const reader = new FileReader();
      templatePreview.classList.remove("hidden");

      if (file.type === "application/pdf") {
        reader.onload = ev => templatePreview.innerHTML = `<iframe src="${ev.target.result}" style="width:100%;height:480px;border:1px solid #ccc;border-radius:6px;"></iframe>`;
        reader.readAsDataURL(file);
      } else if (file.type === "text/html") {
        reader.onload = ev => templatePreview.innerHTML = `<iframe srcdoc="${ev.target.result}" style="width:100%;height:480px;border:1px solid #ccc;border-radius:6px;"></iframe>`;
        reader.readAsText(file);
      } else {
        templatePreview.innerHTML = `<p>📂 Vista previa de plantilla: ${file.name} ✔</p>`;
      }
    } else if (templateSelect) showTemplatePreview(templateSelect.value);
  });

  // =====================================================
  // 🔒 Logout
 
