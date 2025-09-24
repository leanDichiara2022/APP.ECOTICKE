const fs = require("fs");
const path = require("path");

// Carpeta donde se guardarán los logs
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const log = (level, message, extra) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level.toUpperCase()}]: ${message} ${extra ? JSON.stringify(extra) : ""}`;
    console.log(logMessage);
    
    // Guardar en archivo diario simple
    const filePath = path.join(logDir, `${level}.log`);
    fs.appendFileSync(filePath, logMessage + "\n");
};

module.exports = {
    info: (msg, extra) => log("info", msg, extra),
    warn: (msg, extra) => log("warn", msg, extra),
    error: (msg, extra) => log("error", msg, extra)
};
