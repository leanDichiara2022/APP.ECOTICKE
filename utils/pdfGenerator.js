const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generatePDF = (data, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(16).text("Documento PDF", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Datos: ${JSON.stringify(data, null, 2)}`);

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generatePDF;
