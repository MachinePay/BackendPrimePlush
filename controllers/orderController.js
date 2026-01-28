const { Order, OrderProduct } = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// Cria novo pedido com status pending_payment
exports.createOrder = async (req, res) => {
  try {
    console.log("[ORDER] Dados recebidos:", req.body);
    const { userId, items, total, paymentMethod } = req.body;
    if (!userId) return res.status(400).json({ error: "userId obrigatório" });
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "items obrigatório" });
    if (!total) return res.status(400).json({ error: "total obrigatório" });
    if (!paymentMethod)
      return res.status(400).json({ error: "paymentMethod obrigatório" });

    // Garante que o usuário existe, se não existir cria um usuário de teste
    let user = await User.findByPk(userId);
    if (!user) {
      user = await User.create({
        id: userId,
        name: "Usuário Teste",
        cpf: String(Math.floor(Math.random() * 1e11)).padStart(11, "0"),
        cep: "00000000",
        address: "Endereço Teste",
        phone: "11999999999",
        email: `teste${userId}@primeplush.com`,
        password: "123456",
        role: "client",
      });
      console.log(`[ORDER] Usuário de teste criado: id=${userId}`);
    }

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
    console.error("[ORDER] Erro ao criar pedido:", err);
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
