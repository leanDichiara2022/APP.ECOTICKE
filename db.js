// db.js
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB conectado correctamente"))
  .catch((err) => {
    console.error("Error al conectar MongoDB:", err);
    process.exit(1);
  });

module.exports = mongoose;
