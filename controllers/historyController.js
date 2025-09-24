const fs = require("fs");
const path = require("path");

const historyFilePath = path.join(__dirname, "../history.json");

// 📌 Función para guardar en el historial
const saveToHistory = async (fileName, details) => {
  let history = [];

  if (fs.existsSync(historyFilePath)) {
    history = JSON.parse(fs.readFileSync(historyFilePath));
  }

  history.push({ fileName, details, date: new Date() });
  fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
};

// 📌 Función para obtener un historial específico
const getFromHistory = async (fileName) => {
  if (!fs.existsSync(historyFilePath)) return null;

  const history = JSON.parse(fs.readFileSync(historyFilePath));
  return history.find((entry) => entry.fileName === fileName)?.details || null;
};

module.exports = { saveToHistory, getFromHistory };
