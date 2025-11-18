document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const message = document.getElementById("loginMessage");

  // Generar o recuperar deviceId único
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
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
        credentials: "include",   // importante para cookies si el backend setea cookie de sesión
        body: JSON.stringify({ email, password, deviceId }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Respuesta del servidor no válida (HTML recibido).");
      }

      if (response.ok) {
        // Guardar token y usuario (opcional)
        if (result.token) localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user || {}));

        if (message) {
          message.textContent = "Inicio de sesión exitoso. Redirigiendo...";
          message.className = "message success";
        }

        // Redirigimos directo a main.html sin token en la URL
        setTimeout(() => {
          window.location.href = "/main.html";
        }, 700);
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
