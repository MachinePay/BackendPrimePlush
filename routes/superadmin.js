const express = require("express");
const router = express.Router();
const knex = require("knex");
const path = require("path");

console.log("[DEBUG] superadmin.js carregado!");

// 1. Configuração do Banco
const dbConfig = process.env.DATABASE_URL
  ? {
      client: "pg",
      connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      },
    }
  : {
      client: "sqlite3",
      connection: {
        filename: path.join(process.cwd(), "data", "kiosk.sqlite"),
      },
      useNullAsDefault: true,
    };

const db = knex(dbConfig);

// 2. Middleware de autenticação
function superAdminAuth(req, res, next) {
  console.log("[DEBUG] superAdminAuth chamado! Headers:", req.headers);
  const password = req.headers["x-super-admin-password"];
  if (!password || password !== process.env.SUPER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// 3. Endpoint POST - Marcar como recebido
router.post(
  "/super-admin/receivables/mark-received",
  superAdminAuth,
  async (req, res) => {
    console.log("[DEBUG] POST /super-admin/receivables/mark-received chamado!");
    try {
      let { orderIds } = req.body;
      console.log("[DEBUG] req.body:", req.body);

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        console.log("[DEBUG] orderIds inválido:", orderIds);
        return res.status(400).json({ error: "orderIds obrigatório (array)" });
      }

      const now = new Date().toISOString();
      console.log("[DEBUG] orderIds recebidos:", orderIds);

      const updateResult = await db("orders").whereIn("id", orderIds).update({
        repassadoSuperAdmin: 1,
        dataRepasseSuperAdmin: now,
      });

      console.log("[DEBUG] Resultado do update:", updateResult);

      return res.json({
        success: true,
        message: "Recebíveis marcados como recebidos",
        receivedOrderIds: orderIds,
        dataRepasse: now,
        updateResult,
      });
    } catch (err) {
      console.log("[DEBUG] Erro interno:", err);
      return res
        .status(500)
        .json({ error: "Erro interno", details: err.message });
    }
  },
);

// 4. Endpoint GET - Listar recebíveis
router.get("/super-admin/receivables", superAdminAuth, async (req, res) => {
  console.log("[DEBUG] GET /super-admin/receivables chamado!");
  try {
    // Buscar todos os order_ids já recebidos
    const receivablesRows = await db("super_admin_receivables").select(
      "order_ids",
    );
    let receivedOrderIds = [];
    for (const row of receivablesRows) {
      if (row.order_ids) {
        try {
          const ids = JSON.parse(row.order_ids);
          if (Array.isArray(ids)) receivedOrderIds.push(...ids);
        } catch {}
      }
    }
    // Buscar apenas pedidos pagos/autorizados que ainda não foram recebidos
    const paidOrders = await db("orders")
      .whereIn("paymentStatus", ["paid", "authorized"])
      .whereNotIn("id", receivedOrderIds)
      .orderBy("timestamp", "desc");

    // Buscar detalhes dos itens dos pedidos e calcular valor a receber corretamente
    let totalBrutoReceber = 0;
    const detailedOrders = [];
    for (const order of paidOrders) {
      let items = [];
      try {
        items = Array.isArray(order.items)
          ? order.items
          : JSON.parse(order.items);
      } catch {
        items = [];
      }
      // Buscar preço bruto de cada produto
      const detailedItems = [];
      for (const item of items) {
        let precoBruto = 0;
        // Tenta buscar pelo id do produto
        const prodId = item.productId || item.id;
        if (prodId) {
          const prod = await db("products").where({ id: prodId }).first();
          precoBruto = prod && prod.priceRaw ? parseFloat(prod.priceRaw) : 0;
        } else if (item.precoBruto !== undefined) {
          precoBruto = parseFloat(item.precoBruto);
        }
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        const valueToReceive = (price - precoBruto) * quantity;
        detailedItems.push({
          name: item.name || "",
          price,
          precoBruto,
          quantity,
          valueToReceive,
        });
      }
      const orderValueToReceive = detailedItems.reduce(
        (sum, i) => sum + i.valueToReceive,
        0,
      );
      totalBrutoReceber += orderValueToReceive;
      detailedOrders.push({
        id: order.id,
        timestamp: order.timestamp,
        userName: order.userName,
        total: parseFloat(order.total),
        orderValueToReceive,
        items: detailedItems,
        status: order.status,
        paymentType: order.paymentType,
        paymentStatus: order.paymentStatus,
      });
    }

    // Histórico de recebimentos
    const history = await db("super_admin_receivables")
      .select("id", "amount", "received_at", "order_ids")
      .orderBy("received_at", "desc")
      .limit(20);

    // Total já recebido anteriormente
    const totalAlreadyReceived = await db("super_admin_receivables")
      .sum("amount as total")
      .first();

    res.json({
      success: true,
      stats: {
        totalToReceive: Math.max(0, totalBrutoReceber),
        totalReceived: totalBrutoReceber,
        alreadyReceived: parseFloat(totalAlreadyReceived.total) || 0,
      },
      history: history.map((h) => ({
        id: h.id,
        amount: parseFloat(h.amount),
        date: h.received_at,
        orderIds: h.order_ids ? JSON.parse(h.order_ids) : [],
      })),
      orders: detailedOrders,
    });
  } catch (err) {
    console.log("[DEBUG] Erro no GET:", err);
    res
      .status(500)
      .json({ error: "Erro ao buscar dados", details: err.message });
  }
});

module.exports = router;
