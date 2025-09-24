const path = require("path");
const fs = require("fs");
const PDFRegistro = require("../models/pdfRegistro");
const History = require("../models/history");
const sendEmail = require("../utils/sendEmail");
const sendWhatsapp = require("../utils/sendWhatsapp");

const generarPDF = async (req, res) => {
    try {
        const { email, celular } = req.body;

        const fileName = `pdf_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, "..", "generated_pdfs", fileName);
        fs.writeFileSync(filePath, "Contenido del PDF de prueba");

        const registro = new PDFRegistro({
            filePath,
            url: `/generated_pdfs/${fileName}`,
            email,
            celular,
            origen: "ticket"
        });

        await registro.save();

        const nuevoHistorial = new History({
            ticketId: registro._id,
            status: "Enviado"
        });

        await nuevoHistorial.save();

        if (email) {
            await sendEmail({
                to: email,
                subject: "Tu archivo PDF ha sido generado",
                html: `<p>Tu archivo PDF está disponible. <a href="${registro.url}">Descargar</a></p>`
            });
        }

        if (celular) {
            await sendWhatsapp({
                to: celular,
                message: `Tu archivo PDF fue generado exitosamente. Descargalo acá: http://localhost:3000${registro.url}`
            });
        }

        // ✅ AHORA INCLUIMOS fileName en la respuesta
        res.json({
            message: "PDF generado, enviado y registrado correctamente",
            url: registro.url,
            fileName // <- esto era lo que faltaba
        });

    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).json({ error: "Error al generar el PDF" });
    }
};

const obtenerHistorialPDFs = async (req, res) => {
    try {
        const registros = await PDFRegistro.find().sort({ createdAt: -1 });
        res.json(registros);
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ error: "Error al obtener historial" });
    }
};

const buscarCliente = async (req, res) => {
    try {
        const query = req.params.query;

        const resultados = await PDFRegistro.find({
            $or: [
                { email: { $regex: query, $options: "i" } },
                { celular: { $regex: query, $options: "i" } }
            ]
        }).sort({ createdAt: -1 });

        res.json(resultados);
    } catch (error) {
        console.error("Error al buscar cliente:", error);
        res.status(500).json({ error: "Error al buscar cliente" });
    }
};

const registerPDF = async ({ originalFilePath, email, celular, origen }) => {
    try {
        const url = `/uploads/${path.basename(originalFilePath)}`;

        const registro = new PDFRegistro({
            filePath: originalFilePath,
            url,
            email,
            celular,
            origen: origen || "manual"
        });

        await registro.save();

        if (origen === "ticket") {
            const nuevoHistorial = new History({
                ticketId: registro._id,
                status: "Enviado"
            });
            await nuevoHistorial.save();
        }

        if (email) {
            await sendEmail({
                to: email,
                subject: "Tu archivo PDF ha sido registrado",
                html: `<p>Tu archivo PDF fue subido correctamente. <a href="${url}">Descargar</a></p>`
            });
        }

        if (celular) {
            await sendWhatsapp({
                to: celular,
                message: `Tu archivo PDF fue cargado correctamente. Descargalo acá: http://localhost:3000${url}`
            });
        }

        return { success: true, url };
    } catch (error) {
        console.error("Error en registerPDF:", error);
        return { success: false, error };
    }
};

module.exports = {
    generarPDF,
    obtenerHistorialPDFs,
    buscarCliente,
    registerPDF
};
