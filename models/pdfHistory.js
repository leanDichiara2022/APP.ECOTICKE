const mongoose = require("mongoose");

const PDFHistorySchema = new mongoose.Schema({
  filename: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PDFHistory", PDFHistorySchema);
