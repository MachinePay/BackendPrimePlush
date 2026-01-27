const sequelize = require("./db");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

// Importa todos os models para garantir sincronização
require("./models");

// Rotas
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3001;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});
