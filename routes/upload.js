const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CloudConvert = require('cloudconvert');
require('dotenv').config();

const router = express.Router();
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const ext = path.extname(originalName).toLowerCase();
  const mimeType = req.file.mimetype;

  const outputName = path.basename(req.file.filename, ext) + '.pdf';
  const outputPath = path.join('generated_pdfs', outputName);

  // ✅ Si ya es un PDF, lo copiamos directamente
  if (ext === '.pdf' || mimeType === 'application/pdf') {
    try {
      fs.copyFileSync(inputPath, outputPath);
      return res.json({
        message: 'Archivo PDF subido correctamente (sin conversión)',
        filename: outputName,
        path: `/generated_pdfs/${outputName}`
      });
    } catch (err) {
      console.error('Error al copiar el PDF:', err);
      return res.status(500).json({ error: 'Error al guardar el archivo PDF' });
    }
  }

  // ❗ Si no es PDF, lo convertimos con CloudConvert
  try {
    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-my-file': { operation: 'import/upload' },
        'convert-my-file': {
          operation: 'convert',
          input: 'import-my-file',
          output_format: 'pdf'
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file'
        }
      }
    });

    const uploadTask = job.tasks.find(task => task.name === 'import-my-file');
    const uploadUrl = uploadTask.result.form.url;
    const formData = uploadTask.result.form.parameters;

    const FormData = require('form-data');
    const axios = require('axios');
    const form = new FormData();

    for (const key in formData) {
      form.append(key, formData[key]);
    }
    form.append('file', fs.createReadStream(inputPath));

    await axios.post(uploadUrl, form, { headers: form.getHeaders() });

    const completedJob = await cloudConvert.jobs.wait(job.id);
    const exportTask = completedJob.tasks.find(task => task.name === 'export-my-file');
    const fileUrl = exportTask.result.files[0].url;

    const pdfResponse = await axios.get(fileUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(outputPath);
    pdfResponse.data.pipe(writer);

    writer.on('finish', () => {
      return res.json({
        message: 'Archivo convertido correctamente a PDF',
        filename: outputName,
        path: `/generated_pdfs/${outputName}`
      });
    });

    writer.on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: 'Error al guardar el archivo PDF convertido' });
    });

  } catch (error) {
    console.error('Error en la conversión:', error);
    return res.status(500).json({ error: 'Fallo en la conversión del archivo' });
  }
});

module.exports = router;
