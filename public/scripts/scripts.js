document.addEventListener("DOMContentLoaded", () => {
  const sendWhatsappBtn = document.getElementById("sendWhatsappBtn");
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  const phoneInput = document.getElementById("phoneNumber");
  const emailInput = document.getElementById("email");
  const detailsInput = document.getElementById("extraDetails");
  const fileInput = document.getElementById("archivo");
  const pdfMessage = document.getElementById("pdfMessage");

  // ========= CONTENEDOR DE PREVIEW =========
  const previewContainer = document.createElement("div");
  previewContainer.id = "pdfPreviewContainer";
  previewContainer.className = "preview-box hidden";
  document.querySelector(".upload-section").appendChild(previewContainer);

  // =====================================================
  // 📑 SUBIDA Y VISTA PREVIA AUTOMÁTICA
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
          localStorage.setItem("lastUploadedFile", data.fileName);
          pdfMessage.textContent = "✅ Archivo subido correctamente";
          pdfMessage.style.color = "green";

          if (data.url) showPDFPreview(data.url);
        } else {
          pdfMessage.textContent = "❌ Error: " + (data.error || "Error desconocido");
          pdfMessage.style.color = "red";
        }
      } catch (err) {
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
  // 📱 ENVIAR POR WHATSAPP
  // =====================================================
  sendWhatsappBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const countryCode = document.getElementById("countryCode").value;
    const phone = phoneInput.value.trim();
    const fileName = localStorage.getItem("lastUploadedFile");

    if (!phone || !fileName) {
      showToast("⚠️ Ingresá teléfono y subí un archivo", "error");
      return;
    }

    const phoneNumber = countryCode.replace("+", "") + phone;

    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
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
      showToast("❌ Error al enviar mensaje", "error");
    }
  });

  // =====================================================
  // 📧 ENVIAR POR EMAIL
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fileName }),
      });

      const data = await res.json();
      if (res.ok) showToast("📧 Correo enviado correctamente", "success");
      else showToast("❌ No se pudo enviar correo", "error");
    } catch (err) {
      showToast("❌ Error del servidor", "error");
    }
  });

  // =====================================================
  // 🔎 BUSCADOR DE CLIENTES (AUTOCOMPLETE)
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
    } catch {
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
});
