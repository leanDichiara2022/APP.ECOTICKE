const path = require("path");
const fs = require("fs");
const generatePDF = require("../utils/generatePdf");

// 🔥 URL REAL DEL SITIO
const BASE_URL = "https://ecoticke.com";

const generarPDFController = async (req, res) => {
  try {
    console.log("📌 Petición recibida para generar PDF con datos:", req.body);

    const { cliente, total, plantilla } = req.body;

    if (!cliente || !total || !plantilla) {
      console.warn("⚠️ Falta información en la petición:", { cliente, total, plantilla });
      return res.status(400).json({ error: "Faltan datos requeridos." });
    }

    const fileName = `factura_${Date.now()}.pdf`;

    // 📂 carpeta correcta pública
    const outputPath = path.join(__dirname, "../public/generated_pdfs", fileName);

    console.log("📝 Generando PDF en:", outputPath);

    await generatePDF({ cliente, total }, plantilla, outputPath);

    if (!fs.existsSync(outputPath)) {
      console.error("❌ PDF no se generó correctamente.");
      return res.status(500).json({ error: "Error al generar el PDF. Archivo no encontrado." });
    }

    // 🌍 URL ABSOLUTA
    const publicUrl = `${BASE_URL}/generated_pdfs/${fileName}`;

    console.log("✅ PDF generado con éxito:", fileName);

    return res.status(200).json({
      message: "PDF generado con éxito.",
      fileName,
      urlDescarga: publicUrl
    });

  } catch (error) {
    console.error("❌ Error en el controlador al generar PDF:", error);
    return res.status(500).json({ error: "Error al generar el PDF.", details: error.message });
  }
};

module.exports = { generarPDFController };
