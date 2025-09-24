document.getElementById("btnSubir").addEventListener("click", async () => {
    const archivoInput = document.getElementById("archivo");
    const archivo = archivoInput.files[0];

    if (!archivo) {
        alert("Por favor, selecciona un archivo");
        return;
    }

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al subir");

        console.log("✅ Archivo subido:", data);
        alert("Archivo subido correctamente: " + data.nombre);
    } catch (error) {
        console.error("❌ Error al subir:", error);
        alert("Error al subir el archivo");
    }
});
