const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Criar pagamento PIX
router.post("/payment/create-pix", paymentController.createPix);

module.exports = router;
