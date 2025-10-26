const express = require("express");
const Contact = require("../models/Contact");
const auth = require("../middlewares/auth");
const logger = require("../utils/logger");

const router = express.Router();

// Crear un nuevo contacto (requiere autenticación)
router.post("/", auth, async (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        logger.warn("Intento de crear contacto con campos incompletos", { user: req.user.id });
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    try {
        const newContact = new Contact({ 
            name, 
            email, 
            phone, 
            usuario: req.user.id 
        });
        const savedContact = await newContact.save();
        logger.info("Contacto creado correctamente", { contactId: savedContact._id, user: req.user.id });
        res.status(201).json(savedContact);
    } catch (error) {
        logger.error("Error creando el contacto", { error, user: req.user.id });
        res.status(500).json({ message: "Error al crear el contacto" });
    }
});

// Obtener todos los contactos (requiere autenticación)
router.get("/", auth, async (req, res) => {
    try {
        const contacts = await Contact.find({ usuario: req.user.id });
        logger.info("Contactos obtenidos correctamente", { user: req.user.id, count: contacts.length });
        res.status(200).json(contacts);
    } catch (error) {
        logger.error("Error obteniendo los contactos", { error, user: req.user.id });
        res.status(500).json({ message: "Error al obtener los contactos" });
    }
});

// Actualizar un contacto por ID (requiere autenticación)
router.put("/:id", auth, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    if (!name && !email && !phone) {
        logger.warn("Intento de actualizar contacto sin campos", { contactId: id, user: req.user.id });
        return res.status(400).json({ message: "Debe proporcionar al menos un campo para actualizar" });
    }

    try {
        const updatedContact = await Contact.findOneAndUpdate(
            { _id: id, usuario: req.user.id },
            { name, email, phone },
            { new: true, runValidators: true }
        );

        if (!updatedContact) {
            logger.warn("Contacto no encontrado para actualizar", { contactId: id, user: req.user.id });
            return res.status(404).json({ message: "Contacto no encontrado" });
        }

        logger.info("Contacto actualizado correctamente", { contactId: id, user: req.user.id });
        res.status(200).json(updatedContact);
    } catch (error) {
        logger.error("Error actualizando el contacto", { error, contactId: id, user: req.user.id });
        res.status(500).json({ message: "Error al actualizar el contacto" });
    }
});

// Eliminar un contacto por ID (requiere autenticación)
router.delete("/:id", auth, async (req, res) => {
    const { id } = req.params;

    try {
        const deletedContact = await Contact.findOneAndDelete({ _id: id, usuario: req.user.id });

        if (!deletedContact) {
            logger.warn("Intento de eliminar contacto no encontrado", { contactId: id, user: req.user.id });
            return res.status(404).json({ message: "Contacto no encontrado" });
        }

        logger.info("Contacto eliminado correctamente", { contactId: id, user: req.user.id });
        res.status(200).json({ message: "Contacto eliminado correctamente" });
    } catch (error) {
        logger.error("Error eliminando el contacto", { error, contactId: id, user: req.user.id });
        res.status(500).json({ message: "Error al eliminar el contacto" });
    }
});

// Buscar contacto (requiere autenticación)
router.get("/search", auth, async (req, res) => {
    const { phone, email, query } = req.query;
    const searchValue = phone || email || query;

    if (!searchValue) {
        logger.warn("Intento de búsqueda de contacto sin valor", { user: req.user.id });
        return res.status(400).json({ message: "Debe proporcionar un teléfono, correo o query para buscar" });
    }

    try {
        const contacts = await Contact.find({
            usuario: req.user.id,
            $or: [
                { phone: { $regex: searchValue, $options: "i" } },
                { email: { $regex: searchValue, $options: "i" } }
            ]
        }).limit(10);

        if (contacts.length === 0) {
            logger.info("Búsqueda de contacto sin resultados", { searchValue, user: req.user.id });
            return res.status(404).json({ message: "No se encontraron contactos" });
        }

        logger.info("Búsqueda de contacto realizada", { searchValue, user: req.user.id, count: contacts.length });

        if (contacts.length === 1) return res.status(200).json(contacts[0]);
        res.status(200).json({ contacts });
    } catch (error) {
        logger.error("Error en la búsqueda de contacto", { error, searchValue, user: req.user.id });
        res.status(500).json({ message: "Error en la búsqueda" });
    }
});

module.exports = router;
