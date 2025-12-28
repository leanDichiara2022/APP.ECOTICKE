const path = require("path");
const fs = require("fs");
const PDFRegistro = require("../models/pdfRegistro");
const History = require("../models/history");
const sendEmail = require("../utils/sendEmail");
const sendWhatsapp = require("../utils/sendWhatsapp");

// 🌍 BASE_URL tomada del servidor
const BASE_URL = process.env.BASE_URL || "https://ecoticke.com";

const generarPDF = async (req, res) => {
    try {
        const { email, celular } = req.body;

        // asegurar carpeta
        const dir = path.join(__dirname, "..", "generated_pdfs");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        const fileName = `pdf_${Date.now()}.pdf`;
        const filePath = path.join(dir, fileName);

        // PDF de prueba
        fs.writeFileSync(filePath, "Contenido del PDF de prueba");

        //  🌍 URL PUBLICA REAL
        const publicUrl = `${BASE_URL}/generated_pdfs/${fileName}`;

        // guardamos en BD
        const registro = new PDFRegistro({
            filePath,
            url: publicUrl,
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

        // 📧 EMAIL (ahora con URL pública)
        if (email) {
            await sendEmail({
                to: email,
                subject: "Tu archivo PDF ha sido generado",
                html: `
                    <p>Hola 👋</p>
                    <p>Tu archivo PDF está disponible acá:</p>
                    <p><a href="${publicUrl}" target="_blank">${publicUrl}</a></p>
                `
            });
        }

        // 📱 WHATSAPP (sin localhost nunca más)
        if (celular) {
            await sendWhatsapp({
                to: celular,
                message: `Tu archivo PDF fue generado exitosamente. Descargalo acá: ${publicUrl}`
            });
        }

        res.json({
            message: "PDF generado, enviado y registrado correctamente",
            url: publicUrl,
            fileName
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
        const fileName = path.basename(originalFilePath);

        // URL pública correcta
        const url = `${BASE_URL}/uploads/${fileName}`;

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
                html: `<p>Tu archivo PDF fue subido correctamente.<br><a href="${url}">${url}</a></p>`
            });
        }

        if (celular) {
            await sendWhatsapp({
                to: celular,
                message: `Tu archivo PDF fue cargado correctamente. Descargalo acá: ${url}`
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
