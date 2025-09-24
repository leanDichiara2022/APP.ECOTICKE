// routes/templatePreview.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");

const router = express.Router();

// GET /templates/preview/:name
// Renderiza la plantilla EJS ubicada en /templates/<name>.ejs usando datos de ejemplo.
router.get("/preview/:name", async (req, res) => {
  try {
    const name = req.params.name;
    // evita caracteres raros
    if (!/^[a-zA-Z0-9_\-]+$/.test(name)) {
      return res.status(400).send("Nombre de plantilla inválido");
    }

    const filePath = path.join(__dirname, "..", "templates", `${name}.ejs`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Plantilla no encontrada");
    }

    // Datos de ejemplo para render (podés ajustar según las variables que use cada EJS)
    const sampleData = {
      empresa: {
        nombre: "Mi Empresa Demo",
        direccion: "Calle Falsa 123",
        telefono: "11-1234-5678",
        logoUrl: "/images/TickECO-Photoroom.png"
      },
      cliente: {
        nombre: "Cliente Demo",
        razonSocial: "Demo S.A.",
        direccion: "Av. Ejemplo 456",
        email: "cliente@demo.com"
      },
      factura: {
        numero: "0001-00000001",
        fecha: new Date().toLocaleDateString(),
        items: [
          { descripcion: "Producto A", cantidad: 2, precioUnit: 150 },
          { descripcion: "Servicio B", cantidad: 1, precioUnit: 300 }
        ],
        subtotal: 600,
        impuestos: 108,
        total: 708
      },
      notas: "Este es un ejemplo de vista previa."
    };

    // Renderiza el archivo EJS a HTML
    ejs.renderFile(filePath, sampleData, {}, (err, html) => {
      if (err) {
        console.error("Error renderizando plantilla:", err);
        return res.status(500).send("Error al renderizar la plantilla");
      }
      // Enviamos el HTML resultante
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    });
  } catch (error) {
    console.error("Error en preview:", error);
    res.status(500).send("Error en el servidor");
  }
});

module.exports = router;
