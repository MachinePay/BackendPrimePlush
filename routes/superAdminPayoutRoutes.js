const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/superAdminPayoutController");

// GET valor acumulado + histórico
router.get("/superadmin-pending", ctrl.getPendingAndHistory);
// POST marcar como recebido
router.post("/superadmin-receive", ctrl.markAsReceived);
// GET lista de repasses recebidos (com filtro)
router.get("/superadmin-payouts", ctrl.listPayouts);

module.exports = router;
