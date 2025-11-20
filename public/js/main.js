document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

document.addEventListener("DOMContentLoaded", () => {
  const sendWhatsappBtn = document.getElementById("sendWhatsappBtn");
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  const searchClientBtn = document.getElementById("searchClient");
  const phoneInput = document.getElementById("phoneNumber");
  const emailInput = document.getElementById("email");
  const detailsInput = document.getElementById("extraDetails");
  const fileInput = document.getElementById("archivo");
  const pdfMessage = document.getElementById("pdfMessage");
  const previewContainer = document.createElement("div");
  previewContainer.id = "pdfPreviewContainer";
  previewContainer.className = "preview-box hidden";
  document.querySelector(".upload-section").appendChild(previewContainer);

  // =====================================================
  // 📑 Subida y vista previa automática
  // =====================================================
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      pdfMessage.textContent = "⏳ Subiendo archivo...";
      pdfMessage.style.color = "#555";

      const formData = new FormData();
      formData.append("archivo", file);

      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/pdf/upload", {
          method: "POST",
          body: formData,
          headers: token ? { "x-auth-token": token } : undefined,
        });

        if (res.status === 401) {
          pdfMessage.textContent = "⚠️ Sesión expirada. Volvé a iniciar sesión.";
          pdfMessage.style.color = "red";
          return;
        }

        // ✅ Leer texto primero para evitar "body stream already read"
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("El backend no devolvió JSON válido:", text);
          pdfMessage.textContent = "❌ Error al subir archivo (respuesta inválida)";
          pdfMessage.style.color = "red";
          return;
        }

        if (res.ok && data.fileName) {
          localStorage.setItem("lastUploadedFile", data.fileName);
          pdfMessage.textContent = "✅ Archivo subido correctamente";
          pdfMessage.style.color = "green";

          if (data.url) {
            showPDFPreview(data.url);
          } else {
            previewContainer.classList.add("hidden");
          }
        } else {
          pdfMessage.textContent = "❌ Error al subir archivo: " + (data.error || "");
          pdfMessage.style.color = "red";
        }
      } catch (err) {
        console.error("Error al subir archivo:", err);
        pdfMessage.textContent = "❌ Error de conexión al subir archivo";
        pdfMessage.style.color = "red";
      }
    });
  }

  function showPDFPreview(url) {
    previewContainer.innerHTML = `
      <iframe src="${url}" style="width:100%;height:500px;border:none;border-radius:8px;"></iframe>
    `;
    previewContainer.classList.remove("hidden");
  }

  // =====================================================
  // 📱 Enviar por WhatsApp
  // =====================================================
  sendWhatsappBtn &&
    sendWhatsappBtn.addEventListener("click", async (e) => {
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
          localStorage.setItem(
            "lastSentContact",
            JSON.stringify({
              phone,
              email: emailInput.value,
              details,
              fileName,
            })
          );
          if (data.whatsappLink) window.open(data.whatsappLink, "_blank");
        } else {
          showToast("❌ Error al generar el link de WhatsApp", "error");
        }
      } catch (error) {
        console.error("Error enviando WhatsApp:", error);
        showToast("❌ No se pudo enviar por WhatsApp", "error");
      }
    });

  // =====================================================
  // 📧 Enviar por Email
  // =====================================================
  sendEmailBtn &&
    sendEmailBtn.addEventListener("click", async (e) => {
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
          localStorage.setItem(
            "lastSentContact",
            JSON.stringify({
              phone: phoneInput.value,
              email,
              details: detailsInput.value,
              fileName,
            })
          );
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
    zIndex: "1000",
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
    contacts.forEach((contact) => {
      const item = document.createElement("div");
      Object.assign(item.style, {
        padding: "8px",
        cursor: "pointer",
        borderBottom: "1px solid #eee",
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

  [phoneInput, emailInput].forEach((input) => {
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

  searchClientBtn &&
    searchClientBtn.addEventListener("click", async (e) => {
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
    if (
      !searchResultsContainer.contains(e.target) &&
      e.target !== searchClientBtn &&
      e.target !== phoneInput &&
      e.target !== emailInput
    ) {
      searchResultsContainer.style.display = "none";
    }
  });

  // =====================================================
  // 🔒 Logout
  // =====================================================
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      showToast("👋 Sesión cerrada correctamente", "success");
      setTimeout(() => (window.location.href = "/login.html"), 1000);
    });
  }
});
