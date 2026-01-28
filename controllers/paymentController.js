const { createPixPayment } = require("../services/paymentService");

exports.createPix = async (req, res) => {
  try {
    const { amount, description, orderId, email, payerName } = req.body;
    if (!amount)
      return res.status(400).json({ error: "Campo amount é obrigatório" });
    const result = await createPixPayment({
      amount,
      description,
      orderId,
      email,
      payerName,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
