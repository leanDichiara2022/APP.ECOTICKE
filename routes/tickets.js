const express = require("express");
const router = express.Router();
const Ticket = require("../models/ticket");
const History = require("../models/history");
const path = require("path");
const fs = require("fs");

// Crear ticket y generar PDF
router.post("/generar", async (req, res) => {
  try {
    const { cliente, detalles, total, plantilla } = req.body;

    if (!cliente || !detalles || !total) {
      return res.status(400).json({ error: "Faltan datos del ticket" });
    }

    const nuevo = new Ticket({
      cliente,
      detalles,
      total,
      plantilla,
      fecha: new Date(),
    });

    const guardado = await nuevo.save();

    return res.json({
      message: "Ticket generado con éxito",
      ticketId: guardado._id,
    });
  } catch (error) {
    console.error("Error generando ticket:", error);
    res.status(500).json({ error: "Error interno generando ticket" });
  }
});

// Listar historial
router.get("/historial", async (req, res) => {
  try {
    const historial = await History.find().sort({ fecha: -1 });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo historial" });
  }
});

module.exports = router;
