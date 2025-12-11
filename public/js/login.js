// public/js/login.js
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const message = document.getElementById("loginMessage");

  // Crear o recuperar deviceId
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    try {
      deviceId = crypto.randomUUID();
    } catch (e) {
      deviceId = "device-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    }
    localStorage.setItem("deviceId", deviceId);
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      mostrarMensaje("Por favor, completa todos los campos.", "error");
      return;
    }

    try {
      const response = await fetch("/api/usuarios/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, deviceId }),
      });

      const result = await response.json().catch(() => null);

      if (!result) {
        mostrarMensaje("Error: respuesta del servidor no válida.", "error");
        return;
      }

      if (response.ok) {
        if (result.token) localStorage.setItem("authToken", result.token);
        if (result.user) localStorage.setItem("user", JSON.stringify(result.user));

        mostrarMensaje("Inicio de sesión exitoso. Redirigiendo...", "success");

        setTimeout(() => {
          window.location.href = "/main.html";
        }, 600);
      } else {
        mostrarMensaje(result.error || "Error al iniciar sesión.", "error");
      }

    } catch (error) {
      console.error("Login error:", error);
      mostrarMensaje("Hubo un problema al conectar con el servidor.", "error");
    }
  });

  function mostrarMensaje(text, type) {
    if (!message) return alert(text);
    message.textContent = text;
    message.className = "message " + type;
  }
});
