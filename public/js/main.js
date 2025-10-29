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
  // 📑 Subida y vista previa de archivos PDF
  // =====================================================
  const fileInput = document.getElementById("fileInput");
  const previewContainer = document.getElementById("previewContainer");

  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("archivo", file);

      try {
        const res = await fetch("/api/pdf/upload", {
          method: "POST",
          body: formData
        });
        const data = await res.json();

        if (res.ok && data.fileName) {
          localStorage.setItem("lastUploadedFile", data.fileName);
          showToast("✅ Archivo subido correctamente", "success");
          if (data.pdfUrl) openPDFInModal(data.pdfUrl);
        } else {
          showToast("❌ Error al subir archivo", "error");
        }
      } catch (err) {
        console.error("Error al subir archivo:", err);
        showToast("❌ Error de conexión al subir", "error");
      }
    });
  }

  // =====================================================
  // 👁️ Función para mostrar vista previa del PDF
  // =====================================================
  function openPDFInModal(pdfUrl) {
    let modal = document.getElementById("pdfModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "pdfModal";
      Object.assign(modal.style, {
        position: "fixed",
        top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(0,0,0,0.7)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: "9999"
      });
      modal.innerHTML = `
        <div style="background:#fff;padding:10px;border-radius:8px;max-width:90%;max-height:90%;position:relative;">
          <button id="closeModalBtn" style="position:absolute;top:5px;right:10px;border:none;background:#f44336;color:#fff;border-radius:4px;padding:5px 10px;cursor:pointer;">X</button>
          <iframe src="${pdfUrl}" style="width:800px;height:600px;border:none;border-radius:8px;"></iframe>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById("closeModalBtn").addEventListener("click", () => modal.remove());
    }
  }

  // =====================================================
  // 🔒 Logout
  // =====================================================
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      showToast("👋 Sesión cerrada correctamente", "success");
      setTimeout(() => window.location.href = "/login.html", 1000);
    });
  }

  // =====================================================
  // 🔔 Función Toast Global
  // =====================================================
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "10px 15px";
    toast.style.color = "#fff";
    toast.style.borderRadius = "6px";
    toast.style.fontSize = "14px";
    toast.style.zIndex = "9999";
    toast.style.background = type === "success" ? "#4caf50" :
                             type === "error" ? "#f44336" :
                             "#2196f3";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
});
