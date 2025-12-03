// public/scripts/scripts.js
// Lógica del frontend (subida, vista previa, envío, búsqueda, sesión)
// Diseñado para usar SESSION cookies (express-session) -> fetch(..., { credentials: 'include' })

// -------------------- Helpers --------------------
function showToast(msg, type = "info", timeout = 3000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerText = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add("toast-hide");
    setTimeout(() => t.remove(), 400);
  }, timeout);
}

// -------------------- Session check & logout --------------------
async function ensureSessionOrRedirect() {
  try {
    const res = await fetch("/api/usuarios/session", {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) {
      // Si por alguna razón responde error => redirigir a login
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    if (!data.loggedIn) {
      window.location.href = "/login";
    } else {
      // Opcional: mostrar nombre en UI si existe
      if (data.user && data.user.nombre) {
        const title = document.querySelector("#appTitle h1");
        if (title) title.innerText = `Panel — ${data.user.nombre}`;
      }
    }
  } catch (err) {
    console.error("Error verificando sesión:", err);
    window.location.href = "/login";
  }
}

async function logout() {
  try {
    const res = await fetch("/api/usuarios/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
    });
    // No esperar datos, simplemente redirigir al login
    window.location.href = "/login";
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
    window.location.href = "/login";
  }
}

// -------------------- Main DOM logic --------------------
document.addEventListener("DOMContentLoaded", () => {
  // Si estamos en páginas protegidas, verificamos sesión
  // (Esta función redirige si no hay sesión)
  // Ejecutar primero antes de bindear eventos críticos
  ensureSessionOrRedirect();

  const sendWhatsappBtn = document.getElementById("sendWhatsappBtn");
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  const phoneInput = document.getElementById("phoneNumber");
  const emailInput = document.getElementById("email");
  const detailsInput = document.getElementById("extraDetails");
  const fileInput = document.getElementById("archivo");
  const pdfMessage = document.getElementById("pdfMessage");

  // ========= CONTENEDOR DE PREVIEW =========
  let previewContainer = document.getElementById("pdfPreviewContainer");
  if (!previewContainer) {
    previewContainer = document.createElement("div");
    previewContainer.id = "pdfPreviewContainer";
    previewContainer.className = "preview-box hidden";
    const uploadSection = document.querySelector(".upload-section");
    if (uploadSection) uploadSection.appendChild(previewContainer);
    else document.body.appendChild(previewContainer);
  }

  // =====================================================
  // 📑 SUBIDA Y VISTA PREVIA AUTOMÁTICA (usa SESSION cookie)
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
        const res = await fetch("/api/pdf/upload", {
          method: "POST",
          body: formData,
          credentials: "include", // importante para enviar cookie de sesión
        });

        const raw = await res.text();
        let data;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          pdfMessage.textContent = "❌ Respuesta inválida del servidor";
          pdfMessage.style.color = "red";
          return;
        }

        if (res.ok && data.fileName) {
          // guardado local para referencia en esta sesión (no para auth)
          localStorage.setItem("lastUploadedFile", data.fileName);
          pdfMessage.textContent = "✅ Archivo subido correctamente";
          pdfMessage.style.color = "green";

          if (data.url) showPDFPreview(data.url);
        } else {
          pdfMessage.textContent = "❌ Error: " + (data.error || "Error desconocido");
          pdfMessage.style.color = "red";
        }
      } catch (err) {
        console.error("Error al subir archivo:", err);
        pdfMessage.textContent = "❌ Error al procesar archivo";
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
  // 📱 ENVIAR POR WHATSAPP (usa SESSION cookie)
  // =====================================================
  sendWhatsappBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const countryCode = document.getElementById("countryCode")?.value || "";
    const phone = phoneInput?.value.trim();
    const fileName = localStorage.getItem("lastUploadedFile");

    if (!phone || !fileName) {
      showToast("⚠️ Ingresá teléfono y subí un archivo", "error");
      return;
    }

    const phoneNumber = countryCode.replace("+", "") + phone;

    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          fileName,
          details: detailsInput?.value || "",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("📲 Enlace de WhatsApp generado", "success");
        if (data.whatsappLink) window.open(data.whatsappLink, "_blank");
      } else {
        showToast("❌ No se pudo generar el link", "error");
      }
    } catch (err) {
      console.error("Error enviando WhatsApp:", err);
      showToast("❌ Error al enviar mensaje", "error");
    }
  });

  // =====================================================
  // 📧 ENVIAR POR EMAIL (usa SESSION cookie)
  // =====================================================
  sendEmailBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const fileName = localStorage.getItem("lastUploadedFile");

    if (!email || !fileName) {
      showToast("⚠️ Ingresá correo y subí un archivo", "error");
      return;
    }

    try {
      const res = await fetch("/api/correo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fileName }),
      });

      const data = await res.json();
      if (res.ok) showToast("📧 Correo enviado correctamente", "success");
      else showToast("❌ No se pudo enviar correo", "error");
    } catch (err) {
      console.error("Error enviando correo:", err);
      showToast("❌ Error del servidor", "error");
    }
  });

  // =====================================================
  // 🔎 BUSCADOR DE CLIENTES (AUTOCOMPLETE) - usa SESSION cookie
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
      const res = await fetch(`/api/contacts/search?query=${encodeURIComponent(query)}`, {
        method: "GET",
        credentials: "include",
        headers: { "Accept": "application/json" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.contacts || [];
    } catch (err) {
      console.error("Error buscando contactos:", err);
      return [];
    }
  }

  function positionResultsContainer(input) {
    const rect = input.getBoundingClientRect();
    searchResultsContainer.style.top = rect.bottom + window.scrollY + "px";
    searchResultsContainer.style.left = rect.left + window.scrollX + "px";
    searchResultsContainer.style.width = rect.width + "px";
  }

  function showResults(contacts, input) {
    if (!contacts.length) return (searchResultsContainer.style.display = "none");

    searchResultsContainer.innerHTML = "";
    contacts.forEach((c) => {
      const item = document.createElement("div");
      item.style.padding = "8px";
      item.style.cursor = "pointer";
      item.style.borderBottom = "1px solid #eee";
      item.innerText = `${c.name || "Sin nombre"} - ${c.phone || ""} - ${c.email || ""}`;
      item.onclick = () => {
        phoneInput.value = c.phone || "";
        emailInput.value = c.email || "";
        detailsInput.value = c.extraDetails || "";
        searchResultsContainer.style.display = "none";
        showToast("✅ Cliente seleccionado", "success");
      };
      searchResultsContainer.appendChild(item);
    });

    positionResultsContainer(input);
    searchResultsContainer.style.display = "block";
  }

  [phoneInput, emailInput].forEach((input) => {
    input?.addEventListener("input", async () => {
      const query = input.value.trim();
      if (!query) return (searchResultsContainer.style.display = "none");
      const clients = await searchClients(query);
      showResults(clients, input);
    });
  });

  document.addEventListener("click", (e) => {
    if (!searchResultsContainer.contains(e.target)) {
      searchResultsContainer.style.display = "none";
    }
  });

  // -------------------- Extra: permitir Logout desde botón en header --------------------
  window.logout = logout;
});
