// public/js/main.js
(function () {
  // --- 0. Detectar token en la URL y guardarlo (si vino por algún proxy/redirect)
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  const urlToken = getQueryParam("token");
  if (urlToken) {
    try {
      localStorage.setItem("authToken", urlToken);
    } catch (e) {
      console.warn("No se pudo guardar authToken en localStorage:", e);
    }
    // Borrar token de la URL sin recargar la página
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // --- 1. Autenticación mínima: si no hay token ni en localStorage, volver a login
  const token = localStorage.getItem("authToken");
  if (!token) {
    // no token -> redirect
    window.location.href = "/login.html";
    return;
  }

  // --- 2. Iniciar lógica principal cuando el DOM esté listo
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

    const uploadSection = document.querySelector(".upload-section");
    if (uploadSection) uploadSection.appendChild(previewContainer);

    // =====================================================
    // 📑 Subida y vista previa automática
    // =====================================================
    if (fileInput) {
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (pdfMessage) {
          pdfMessage.textContent = "⏳ Subiendo archivo...";
          pdfMessage.style.color = "#555";
        }

        const formData = new FormData();
        formData.append("archivo", file);

        try {
          const tokenLocal = localStorage.getItem("authToken");
          const headers = tokenLocal ? { "x-auth-token": tokenLocal } : undefined;

          const res = await fetch("/api/pdf/upload", {
            method: "POST",
            body: formData,
            headers,
          });

          if (res.status === 401) {
            if (pdfMessage) {
              pdfMessage.textContent = "⚠️ Sesión expirada. Volvé a iniciar sesión.";
              pdfMessage.style.color = "red";
            }
            return;
          }

          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (err) {
            console.error("El backend no devolvió JSON válido:", text);
            if (pdfMessage) {
              pdfMessage.textContent = "❌ Error al subir archivo (respuesta inválida)";
              pdfMessage.style.color = "red";
            }
            return;
          }

          if (res.ok && data.fileName) {
            localStorage.setItem("lastUploadedFile", data.fileName);
            if (pdfMessage) {
              pdfMessage.textContent = "✅ Archivo subido correctamente";
              pdfMessage.style.color = "green";
            }

            if (data.url) {
              showPDFPreview(data.url);
            } else {
              previewContainer.classList.add("hidden");
            }
          } else {
            if (pdfMessage) {
              pdfMessage.textContent = "❌ Error al subir archivo: " + (data.error || "");
              pdfMessage.style.color = "red";
            }
          }
        } catch (err) {
          console.error("Error al subir archivo:", err);
          if (pdfMessage) {
            pdfMessage.textContent = "❌ Error de conexión al subir archivo";
            pdfMessage.style.color = "red";
          }
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
    if (sendWhatsappBtn) {
      sendWhatsappBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const countryCodeEl = document.getElementById("countryCode");
        const countryCode = countryCodeEl ? countryCodeEl.value : "+54";
        const phone = phoneInput ? phoneInput.value.trim() : "";
        const details = detailsInput ? detailsInput.value : "";
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
                email: emailInput ? emailInput.value : "",
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
    }

    // =====================================================
    // 📧 Enviar por Email
    // =====================================================
    if (sendEmailBtn) {
      sendEmailBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const emailVal = emailInput ? emailInput.value.trim() : "";
        const fileName = localStorage.getItem("lastUploadedFile");

        if (!emailVal || !fileName) {
          showToast("⚠️ Debes ingresar un correo y subir un archivo primero.", "error");
          return;
        }

        try {
          const res = await fetch("/api/correo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailVal, fileName }),
          });

          const data = await res.json();
          if (res.ok) {
            showToast("📧 Correo enviado con éxito!", "success");
            localStorage.setItem(
              "lastSentContact",
              JSON.stringify({
                phone: phoneInput ? phoneInput.value : "",
                email: emailVal,
                details: detailsInput ? detailsInput.value : "",
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
    }

    // =====================================================
    // 🔎 Buscar Cliente (autocomplete)
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

    function positionResultsContainer(input) {
      if (!input) return;
      const rect = input.getBoundingClientRect();
      searchResultsContainer.style.top = rect.bottom + window.scrollY + "px";
      searchResultsContainer.style.left = rect.left + window.scrollX + "px";
      searchResultsContainer.style.width = rect.width + "px";
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
          if (phoneInput) phoneInput.value = contact.phone || "";
          if (emailInput) emailInput.value = contact.email || "";
          if (detailsInput) detailsInput.value = contact.extraDetails || "";
          searchResultsContainer.style.display = "none";
          showToast(`✅ Contacto seleccionado`, "success");
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

    if (searchClientBtn) {
      searchClientBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const query = (phoneInput && phoneInput.value.trim()) || (emailInput && emailInput.value.trim());
        if (!query) {
          showToast("⚠️ Ingresa un teléfono o correo para buscar.", "error");
          return;
        }
        const contacts = await searchClients(query);
        showResults(contacts, phoneInput);
      });
    }

    document.addEventListener("click", (e) => {
      if (!searchResultsContainer.contains(e.target)) {
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
        // opcional: llamar a /api/usuarios/logout si quieres limpiar server-side
        localStorage.clear();
        showToast("👋 Sesión cerrada correctamente", "success");
        setTimeout(() => (window.location.href = "/login.html"), 800);
      });
    }
  });

  // small helper toast (si no lo tenés, es inofensivo)
  function showToast(msg, type) {
    // intenta usar una función existente; si no existe, alerta simple
    if (typeof window.showToast === "function") {
      window.showToast(msg, type);
      return;
    }
    console.log(`[TOAST ${type}] ${msg}`);
  }
})();
