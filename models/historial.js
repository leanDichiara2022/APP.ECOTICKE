document.addEventListener("DOMContentLoaded", async () => {
    const historialBody = document.getElementById("historial-body");
    const filtroCliente = document.getElementById("filtro-cliente");
    const filtroEstado = document.getElementById("filtro-estado");
    const btnLimpiarHistorial = document.getElementById("btn-limpiar-historial");

    async function cargarHistorial() {
        try {
            const response = await fetch("/api/historial-pdfs");
            if (!response.ok) throw new Error("Error al obtener el historial");
            
            const historial = await response.json();
            historialBody.innerHTML = "";

            historial.forEach(pdf => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${pdf.filename}</td>
                    <td>${pdf.plantilla}</td>
                    <td>${pdf.total}</td>
                    <td>${new Date(pdf.createdAt).toLocaleString()}</td>
                    <td>${pdf.status}</td>
                    <td>
                        <a href="${pdf.urlDescarga}" target="_blank" class="btn-descargar">Descargar</a>
                        <button class="btn-borrar" data-id="${pdf._id}">Borrar</button>
                    </td>
                `;
                historialBody.appendChild(fila);
            });
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
    }

    document.addEventListener("click", async (event) => {
        if (event.target.classList.contains("btn-borrar")) {
            const id = event.target.getAttribute("data-id");
            try {
                await fetch(`/api/historial-pdfs/${id}`, { method: "DELETE" });
                cargarHistorial();
            } catch (error) {
                console.error("Error al borrar PDF:", error);
            }
        }
    });

    btnLimpiarHistorial.addEventListener("click", async () => {
        try {
            await fetch("/api/historial-pdfs/limpiar", { method: "DELETE" });
            cargarHistorial();
        } catch (error) {
            console.error("Error al limpiar historial viejo:", error);
        }
    });

    cargarHistorial();
});
