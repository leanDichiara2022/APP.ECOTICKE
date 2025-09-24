// /electron/main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const chokidar = require("chokidar");
const fs = require("fs");

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true, // 🔹 Necesario para usar ipcRenderer en el frontend
      contextIsolation: false,
    },
  });

  // 🔹 Cargar directamente la página principal
  mainWindow.loadURL("http://localhost:3000/main");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- Watcher de carpeta de impresora virtual
function startPrinterWatcher() {
  const printerFolder = path.join(__dirname, "..", "virtual_printer");

  // Crear carpeta si no existe
  if (!fs.existsSync(printerFolder)) {
    fs.mkdirSync(printerFolder);
  }

  const watcher = chokidar.watch(printerFolder, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });

  watcher.on("add", (filePath) => {
    console.log("📄 Archivo detectado:", filePath);
    if (mainWindow) {
      mainWindow.webContents.send("new-print-file", filePath);
    }
  });
}

// Cuando arranca Electron → inicia el servidor Node y el watcher
app.on("ready", () => {
  // Levanta el servidor con Node (server.js)
  serverProcess = spawn("node", ["server.js"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    shell: true,
  });

  createWindow();
  startPrinterWatcher();
});

// Cerrar todo cuando se cierre la app
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
