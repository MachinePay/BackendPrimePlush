const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Criar novo pedido
router.post("/", orderController.createOrder);
// Confirmar pagamento físico
router.post("/confirm-physical", orderController.confirmPhysicalPayment);
// Cancelar pedido
router.post("/cancel", orderController.cancelOrder);
// Listar pedidos pagos (para cozinha)
router.get("/active", orderController.listActiveOrders);

module.exports = router;
