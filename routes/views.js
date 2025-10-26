const express = require("express");
const path = require("path");
const auth = require("../middleware/auth");

const router = express.Router();

// Páginas protegidas
router.get("/main.html", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/main.html"));
});

router.get("/tickets.html", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/tickets.html"));
});

router.get("/contacts.html", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/contacts.html"));
});

router.get("/plans.html", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/plans.html"));
});

module.exports = router;
