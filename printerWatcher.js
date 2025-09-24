const chokidar = require("chokidar");
const path = require("path");
const { ipcMain } = require("electron");

// Carpeta donde el sistema de facturación "envía" archivos a imprimir
const printerFolder = path.join(__dirname, "virtual_printer");

// Inicia watcher
const watcher = chokidar.watch(printerFolder, {
  ignored: /(^|[\/\\])\../, // Ignora archivos ocultos
  persistent: true
});

watcher.on("add", (filePath) => {
  console.log("📄 Archivo detectado:", filePath);

  // Si Electron está activo, enviamos mensaje
  if (ipcMain) {
    ipcMain.emit("new-print-file", null, filePath);
  }
});
