const templates = {
    factura_simple: {
      name: "Factura Simple",
      layout: "simple",
      styles: {
        font: "Arial",
        color: "black",
        headerSize: 14,
      },
    },
    factura_moderno: {
      name: "Factura Moderna",
      layout: "modern",
      styles: {
        font: "Helvetica",
        color: "blue",
        headerSize: 16,
      },
    },
    remito_basico: {
      name: "Remito Básico",
      layout: "basic",
      styles: {
        font: "Times New Roman",
        color: "gray",
        headerSize: 12,
      },
    },
    remito_detallado: {
      name: "Remito Detallado",
      layout: "detailed",
      styles: {
        font: "Courier New",
        color: "black",
        headerSize: 14,
      },
    },
  };
  
  function getTemplate(templateName) {
    return templates[templateName] || templates.factura_simple;
  }
  
  module.exports = { templates, getTemplate };
  