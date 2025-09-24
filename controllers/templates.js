// controllers/templates.js
const ConfiguracionUsuario = require("../models/configuracionUsuario");
const path = require("path");

// =========================
// 📌 Map de plantillas predefinidas
// =========================
function getTemplate(templateName) {
  const templates = {
    factura_simple: {
      name: "Factura Simple",
      styles: { font: "Helvetica-Bold", headerSize: 18, color: "black" },
    },
    factura_moderno: {
      name: "Factura Moderna",
      styles: { font: "Times-Roman", headerSize: 20, color: "blue" },
    },
    factura_clasica: {
      name: "Factura Clásica",
      styles: { font: "Courier", headerSize: 16, color: "darkred" },
    },
  };

  return templates[templateName] || templates["factura_simple"];
}

// =========================
// 📌 Guardar plantilla seleccionada
// =========================
async function setTemplate(req, res) {
  try {
    const { usuarioId, plantilla } = req.body;

    if (!usuarioId || !plantilla) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const config = await ConfiguracionUsuario.findOneAndUpdate(
      { usuarioId },
      { plantilla, plantillaPersonalizada: null }, // si elige una predefinida, borramos la custom
      { new: true, upsert: true }
    );

    res.json({ success: true, config });
  } catch (error) {
    console.error("Error guardando plantilla:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}

// =========================
// 📌 Subir plantilla personalizada (archivo EJS o similar)
// =========================
async function uploadCustomTemplate(req, res) {
  try {
    const { usuarioId } = req.body;

    if (!usuarioId || !req.file) {
      return res.status(400).json({ error: "Faltan datos o archivo" });
    }

    const fileName = req.file.filename;
    const filePath = path.join("uploads/templates", fileName);

    const config = await ConfiguracionUsuario.findOneAndUpdate(
      { usuarioId },
      { plantilla: "custom", plantillaPersonalizada: filePath },
      { new: true, upsert: true }
    );

    res.json({ success: true, config });
  } catch (error) {
    console.error("Error subiendo plantilla personalizada:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}

// =========================
// 📌 Obtener la plantilla actual del usuario
// =========================
async function getUserTemplate(req, res) {
  try {
    const { usuarioId } = req.params;
    const config = await ConfiguracionUsuario.findOne({ usuarioId });

    if (!config) {
      return res.json({ plantilla: "factura_simple" });
    }

    res.json({
      plantilla: config.plantilla,
      personalizada: config.plantillaPersonalizada || null,
    });
  } catch (error) {
    console.error("Error obteniendo plantilla:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}

module.exports = {
  getTemplate,
  setTemplate,
  uploadCustomTemplate,
  getUserTemplate,
};
