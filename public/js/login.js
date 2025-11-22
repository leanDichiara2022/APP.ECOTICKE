// public/js/login.js
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const message = document.getElementById("loginMessage");

  // Generar o recuperar deviceId único
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    try {
      deviceId = crypto.randomUUID();
    } catch (e) {
      // fallback para navegadores antiguos
      deviceId = "device-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    }
    localStorage.setItem("deviceId", deviceId);
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      if (message) {
        message.textContent = "Por favor, completa todos los campos.";
        message.className = "message error";
      } else {
        alert("Por favor, completa todos los campos.");
      }
      return;
    }

    try {
      const response = await fetch("/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, deviceId }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Respuesta del servidor no válida.");
      }

      if (response.ok) {
        // Guardar token en localStorage bajo la clave "authToken"
        if (result.token) localStorage.setItem("authToken", result.token);
        localStorage.setItem("user", JSON.stringify(result.user || {}));

        if (message) {
          message.textContent = "Inicio de sesión exitoso. Redirigiendo...";
          message.className = "message success";
        }

        // Redirigir a main.html (sin token en URL — veremos en main.js si aparece token externo)
        setTimeout(() => {
          window.location.href = "/main.html";
        }, 500);
      } else {
        if (message) {
          message.textContent = result.message || "Error al iniciar sesión.";
          message.className = "message error";
        } else {
          alert(result.message || "Error al iniciar sesión.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      if (message) {
        message.textContent = "Hubo un error al conectar con el servidor.";
        message.className = "message error";
      } else {
        alert("Hubo un error al conectar con el servidor.");
      }
    }
  });
});
