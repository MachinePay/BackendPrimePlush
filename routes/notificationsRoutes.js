const express = require("express");
const router = express.Router();

// Mercado Pago envia notificações IPN para este endpoint
const { Order } = require("../models/Order");
const fetch = require("node-fetch");

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

// POST: Mercado Pago IPN
router.post("/notifications/mercadopago", async (req, res) => {
  try {
    const notification = req.body;
    const query = req.query;
    console.log("[MP IPN] Notificação recebida:", {
      body: notification,
      query,
    });

    // Extrai o payment_id da notificação
    const paymentId = notification.data?.id || query.id;
    if (!paymentId) {
      console.log("[MP IPN] Nenhum payment_id encontrado na notificação.");
      return res.status(200).json({ received: true, noPaymentId: true });
    }

    // Consulta o pagamento no Mercado Pago
    const mp_access_token = process.env.MP_ACCESS_TOKEN;
    if (!mp_access_token) {
      console.error("[MP IPN] MP_ACCESS_TOKEN não configurado!");
      return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado" });
    }
    const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;
    const mpRes = await fetch(url, {
      headers: { Authorization: `Bearer ${mp_access_token}` },
    });
    const paymentData = await mpRes.json();
    console.log("[MP IPN] Dados do pagamento consultado:", paymentData);

    // Se aprovado, atualiza o pedido
    if (paymentData.status === "approved") {
      const orderId = paymentData.external_reference;
      if (!orderId) {
        console.error(
          "[MP IPN] external_reference (orderId) não encontrado no pagamento!",
        );
      } else {
        const order = await Order.findByPk(orderId);
        if (!order) {
          console.error(
            `[MP IPN] Pedido não encontrado para orderId=${orderId}`,
          );
        } else {
          order.status = "active";
          await order.save();
          console.log(
            `[MP IPN] Pedido ${orderId} atualizado para status 'active'.`,
          );
        }
      }
    } else {
      console.log(`[MP IPN] Pagamento status: ${paymentData.status}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[MP IPN] Erro ao processar notificação:", err);
    res.status(500).json({ error: "Erro ao processar notificação" });
  }
});

module.exports = router;
