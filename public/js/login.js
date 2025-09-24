document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

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
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      // ✅ ruta corregida
      const response = await fetch("/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, deviceId }),
      });

      const result = await response.json();

      if (response.ok) {
        window.location.href = "/main"; // 👈 corregido (server.js sirve /main, no /main.html)
      } else {
        alert(result.message || "Error al iniciar sesión.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un error al conectar con el servidor.");
    }
  });
});
