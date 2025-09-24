const path = require("path");
const fs = require("fs");
const PDFRegistro = require("../models/pdfRegistro");
const History = require("../models/history");
const sendEmail = require("../utils/sendEmail");
const generarWhatsappLink = require("../utils/sendWhatsapp");

// Generar PDF y enviar por email/whatsapp link
const generarPDF = async (req, res) => {
    try {
        const { email, celular } = req.body;

        // Ruta del archivo PDF generado
        const pdfFileName = `ticket_${Date.now()}.pdf`;
        const pdfPath = path.join(__dirname, "../generated_pdfs", pdfFileName);

        // Acá iría tu lógica de generación del PDF
        fs.writeFileSync(pdfPath, "Contenido de prueba del PDF...");

        // URL pública para descargar el PDF
        const pdfUrl = `http://localhost:3000/generated_pdfs/${pdfFileName}`;

        // Enviar por email si hay
        if (email) {
            await sendEmail(email, "Tu ticket PDF", `Descargalo aquí: ${pdfUrl}`);
        }

        // Generar link de WhatsApp si hay celular
        let whatsappLink = null;
        if (celular) {
            whatsappLink = generarWhatsappLink(celular, pdfUrl);
        }

        // Registrar en historial
        await History.create({
            ticketId: pdfFileName,
            estado: "Enviado",
            fecha: new Date()
        });

        res.json({
            success: true,
            message: "PDF generado correctamente",
            pdfUrl,
            whatsappLink
        });
    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).json({ success: false, error: "Error al generar PDF" });
    }
};

module.exports = { generarPDF };
