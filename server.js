const sequelize = require("./db");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(
  process.env.MONGO_URL || "mongodb://localhost:27017/primeplush",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

// Rotas
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

const PORT = process.env.PORT || 3001;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});
