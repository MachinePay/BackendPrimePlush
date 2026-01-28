const sequelize = require("./db");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Log de todas as requisições recebidas
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Importa todos os models para garantir sincronização
require("./models");

// Rotas

const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const superAdminPayoutRoutes = require("./routes/superAdminPayoutRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", superAdminPayoutRoutes);
app.use("/api", adminAuthRoutes);
app.use("/api", paymentRoutes);
const notificationsRoutes = require("./routes/notificationsRoutes");
app.use("/api", notificationsRoutes);

const PORT = process.env.PORT || 3001;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});
