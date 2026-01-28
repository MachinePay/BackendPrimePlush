const { Order, OrderProduct } = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// Cria novo pedido com status pending_payment
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, total, paymentMethod } = req.body;
    const order = await Order.create({
      userId,
      total,
      paymentMethod,
      status: "pending_payment",
    });
    // Cria os itens do pedido
    for (const item of items) {
      await OrderProduct.create({
        OrderId: order.id,
        ProductId: item.productId,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
      });
    }
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Confirma pagamento físico (Mercado Pago)
exports.confirmPhysicalPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
    order.status = "active";
    await order.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cancela pedido (pagamento não realizado)
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
    order.status = "cancelled";
    await order.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lista pedidos pagos (para "cozinha")
exports.listActiveOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status: "active" },
      include: [OrderProduct, Product, User],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
