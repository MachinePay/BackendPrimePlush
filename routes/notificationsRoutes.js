const express = require("express");
const router = express.Router();

// Mercado Pago envia notificações IPN para este endpoint
router.post("/notifications/mercadopago", async (req, res) => {
  // Permitir GET para teste do Mercado Pago
  router.get("/notifications/mercadopago", async (req, res) => {
    try {
      const query = req.query;
      console.log("[MP IPN - GET] Notificação recebida:", { query });
      res.status(200).json({ received: true, method: "GET" });
    } catch (err) {
      console.error("[MP IPN - GET] Erro ao processar notificação:", err);
      res.status(500).json({ error: "Erro ao processar notificação" });
    }
  });
  try {
    // Mercado Pago envia dados no body e/ou query
    const notification = req.body;
    const query = req.query;
    console.log("[MP IPN] Notificação recebida:", {
      body: notification,
      query,
    });
    // Aqui você pode processar o pagamento, atualizar status, etc.
    // Exemplo: buscar status do pagamento pelo payment_id
    // const paymentId = notification.data?.id || query.id;
    // ...
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[MP IPN] Erro ao processar notificação:", err);
    res.status(500).json({ error: "Erro ao processar notificação" });
  }
});

module.exports = router;
