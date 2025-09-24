document.addEventListener("DOMContentLoaded", () => {
    const historyTableBody = document.querySelector("#historyTableBody");

    // Función para cargar el historial
    async function loadHistory() {
        try {
            const response = await fetch("/history/data"); // Cambié la URL
            if (!response.ok) {
                throw new Error("Error al cargar el historial");
            }

            const historyData = await response.json();

            // Vaciar la tabla antes de rellenarla
            historyTableBody.innerHTML = "";

            // Añadir filas por cada entrada en el historial
            historyData.forEach((entry) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${entry.ticketId}</td>
                    <td>${new Date(entry.createdAt).toLocaleString()}</td>
                    <td>${entry.status}</td>
                    <td><a href="#">Ver Detalle</a></td>
                `;

                historyTableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error cargando el historial:", error);
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="4">Error al cargar el historial.</td>
                </tr>
            `;
        }
    }

    // Llamar a la función para cargar el historial
    loadHistory();
});
