const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Ticket = require("../models/ticket");

// Obtener todos los datos del historial
router.get("/data", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

// Eliminar un ticket del historial
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Registro no encontrado" });
    }

    const pdfPath = path.join(__dirname, "../generated_pdfs", `${ticket._id}.pdf`);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    await Ticket.findByIdAndDelete(id);
    res.json({ success: true, message: "Registro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el registro:", error);
    res.status(500).json({ success: false, message: "Error al eliminar el registro" });
  }
});

module.exports = router;
