const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Usuario = require("../models/usuarios");
const PDFHistory = require("../models/pdfHistory");
const { getTemplate } = require("../utils/templates");

// Función para generar PDF con una plantilla seleccionada
const generarPDF = async (req, res) => {
    try {
        const { plantilla, datos } = req.body;
        const usuarioId = req.user.id;
        
        // Obtener datos del negocio del usuario
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario || !usuario.negocio) {
            return res.status(404).json({ error: "Datos del negocio no encontrados" });
        }

        // Obtener plantilla
        const template = getTemplate(plantilla);
        if (!template) {
            return res.status(400).json({ error: `No se encontró la plantilla: ${plantilla}` });
        }

        // Crear documento PDF
        const doc = new PDFDocument();
        const fileName = `factura_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, "../generated_pdfs", fileName);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Configurar fuente si está disponible
        const fontPath = path.join("C:", "Windows", "Fonts", "arial.ttf");
        if (fs.existsSync(fontPath)) {
            doc.font(fontPath);
        }
        
        // Aplicar estilo de la plantilla
        doc.fontSize(template.styles.headerSize).fillColor(template.styles.color);
        doc.text(template.name, { align: "center" });
        doc.moveDown();

        // Agregar datos del negocio
        doc.fontSize(14).fillColor("black");
        doc.text(`Negocio: ${usuario.negocio.nombre}`);
        doc.text(`Dirección: ${usuario.negocio.direccion}`);
        doc.text(`Teléfono: ${usuario.negocio.telefono}`);
        doc.moveDown();

        // Agregar datos del cliente
        doc.text(`Cliente: ${datos.cliente}`);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        // Agregar artículos y calcular total
        let total = 0;
        datos.articulos.forEach((articulo) => {
            const subtotal = articulo.precio * articulo.cantidad;
            total += subtotal;
            doc.text(`${articulo.nombre} - ${articulo.cantidad} x $${articulo.precio} = $${subtotal}`);
        });
        doc.moveDown();

        // Aplicar IVA y descuentos si es necesario
        if (datos.iva) {
            const iva = (total * datos.iva) / 100;
            total += iva;
            doc.text(`IVA (${datos.iva}%): $${iva.toFixed(2)}`);
        }
        if (datos.descuento) {
            total -= datos.descuento;
            doc.text(`Descuento: -$${datos.descuento.toFixed(2)}`);
        }

        doc.moveDown();
        doc.text(`Total: $${total.toFixed(2)}`, { bold: true });
        doc.end();

        stream.on("finish", async () => {
            // Guardar historial de PDF generado
            const newEntry = new PDFHistory({
                filename: fileName,
                status: "Generado",
                plantilla,
                total,
                urlDescarga: `/generated_pdfs/${fileName}`,
                createdAt: Date.now(),
            });
            await newEntry.save();

            res.json({ message: "PDF generado con éxito", url: `/generated_pdfs/${fileName}` });
        });
    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// Exportar funciones
module.exports = { generarPDF };
