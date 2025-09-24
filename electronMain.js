// electronMain.js (completo con watcher)
const { app, BrowserWindow } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL("http://localhost:3000");
  // mainWindow.webContents.openDevTools();
}

// Watcher de carpeta de impresora virtual (ejemplo Windows)
// Esta carpeta debe ser la “carpeta de impresión” donde el sistema genera PDFs o trabajos
const printWatcherFolder = path.join(__dirname, "watch_print"); // Crear esta carpeta

function startPrintWatcher() {
  if (!fs.existsSync(printWatcherFolder)) fs.mkdirSync(printWatcherFolder);

  fs.watch(printWatcherFolder, (eventType, filename) => {
    if (filename && eventType === "rename") {
      const filePath = path.join(printWatcherFolder, filename);
      if (fs.existsSync(filePath)) {
        console.log("📄 Nuevo archivo detectado:", filePath);
        // Abrir automáticamente el archivo en la app (puedes cambiar a tu lógica)
        mainWindow.webContents.send("new-print-file", filePath);

        // Opcional: eliminar o mover el archivo después de procesarlo
        // fs.unlinkSync(filePath);
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  startPrintWatcher();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
