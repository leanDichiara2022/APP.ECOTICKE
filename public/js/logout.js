document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.getElementById("logout-btn");
  
    if (logoutButton) {
      logoutButton.addEventListener("click", async function () {
        try {
          const response = await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
  
          if (response.ok) {
            // Borrar el deviceId guardado en el navegador
            localStorage.removeItem("deviceId");
  
            // Redirigir al login
            window.location.href = "/login.html";
          } else {
            const result = await response.json();
            alert(result.message || "No se pudo cerrar sesión.");
          }
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
          alert("Hubo un error al cerrar sesión.");
        }
      });
    }
  });
  