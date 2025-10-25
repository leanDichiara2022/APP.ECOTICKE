document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const message = document.getElementById("registerMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;

    // Validaciones básicas
    if (!nombre || !email || !password || !confirm) {
      message.textContent = "Todos los campos son obligatorios.";
      message.className = "message error";
      return;
    }

    if (password !== confirm) {
      message.textContent = "Las contraseñas no coinciden.";
      message.className = "message error";
      return;
    }

    // Generar o recuperar un deviceId único
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("deviceId", deviceId);
    }

    try {
      // ✅ Ruta correcta (sin /api/usuarios)
      const response = await fetch("/api/usuarios/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, deviceId }),
      });

      const data = await response.json();

      if (response.ok) {
        message.textContent = "✅ Registro exitoso. Redirigiendo...";
        message.className = "message success";
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else {
        message.textContent = data.message || "Error al registrar.";
        message.className = "message error";
      }
    } catch (err) {
      console.error("Error en registro:", err);
      message.textContent = "Error del servidor o conexión fallida.";
      message.className = "message error";
    }
  });
});
