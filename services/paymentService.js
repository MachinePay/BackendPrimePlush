const fetch = require("node-fetch");

async function createPixPayment({
  amount,
  description,
  orderId,
  email,
  payerName,
}) {
  const mp_access_token = process.env.MP_ACCESS_TOKEN;
  if (!mp_access_token)
    throw new Error("Access Token do Mercado Pago não configurado");

  const idempotencyKey = `pix_${orderId || Date.now()}_${Date.now()}`;
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mp_access_token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      transaction_amount: parseFloat(amount),
      description: description || "Pedido",
      payment_method_id: "pix",
      payer: {
        email: email || "cliente@loja.com",
        first_name: payerName || "Cliente",
      },
      external_reference: orderId,
      notification_url: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/api/notifications/mercadopago`
        : undefined,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Erro ao criar PIX");
  return {
    paymentId: data.id,
    status: data.status,
    qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    qrCodeCopyPaste: data.point_of_interaction?.transaction_data?.qr_code,
    type: "pix",
  };
}

module.exports = { createPixPayment };
