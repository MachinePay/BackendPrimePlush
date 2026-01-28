const { OrderProduct } = require("../models/Order");
const { SuperAdminPayout } = require("../models");
const { Op } = require("sequelize");

// Retorna o valor acumulado a receber e histórico de repasses
exports.getPendingAndHistory = async (req, res) => {
  try {
    // Soma diferença de todos os OrderProduct ainda não repassados
    // Considera repassados os que foram criados antes do último payout
    const lastPayout = await SuperAdminPayout.findOne({
      order: [["receivedAt", "DESC"]],
    });
    const where = lastPayout
      ? { createdAt: { [Op.gt]: lastPayout.receivedAt } }
      : {};
    const orderProducts = await OrderProduct.findAll({ where });
    const pendingAmount = orderProducts.reduce(
      (sum, op) => sum + (op.sellingPrice - op.costPrice) * op.quantity,
      0,
    );
    // Histórico de repasses
    const payouts = await SuperAdminPayout.findAll({
      order: [["receivedAt", "DESC"]],
    });
    const history = payouts.map((p) => ({
      date: p.receivedAt,
      amount: p.amount,
      notes: p.notes,
    }));
    res.json({ pendingAmount, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Marca como recebido: registra payout e zera acumulado
exports.markAsReceived = async (req, res) => {
  try {
    // Calcula valor a receber
    const lastPayout = await SuperAdminPayout.findOne({
      order: [["receivedAt", "DESC"]],
    });
    const where = lastPayout
      ? { createdAt: { [Op.gt]: lastPayout.receivedAt } }
      : {};
    const orderProducts = await OrderProduct.findAll({ where });
    const amount = orderProducts.reduce(
      (sum, op) => sum + (op.sellingPrice - op.costPrice) * op.quantity,
      0,
    );
    if (amount > 0) {
      await SuperAdminPayout.create({ amount });
    }
    res.json({ success: true, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lista repasses recebidos, com filtro opcional por data
exports.listPayouts = async (req, res) => {
  try {
    const { start, end } = req.query;
    const where = {};
    if (start) where.receivedAt = { [Op.gte]: new Date(start) };
    if (end) {
      where.receivedAt = where.receivedAt || {};
      where.receivedAt[Op.lte] = new Date(end);
    }
    const payouts = await SuperAdminPayout.findAll({
      where,
      order: [["receivedAt", "DESC"]],
    });
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
