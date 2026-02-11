import express from "express";
import knex from "knex";
import path from "path";
const router = express.Router();

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
  const password = req.headers["x-super-admin-password"];
  if (!password || password !== process.env.SUPER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// 3. Endpoint POST - Marcar como recebido
router.post("/super-admin/receivables/mark-received", superAdminAuth, async (req, res) => {
  try {
    let { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: "orderIds obrigatório (array)" });
    }

    const now = new Date().toISOString();

    const updateResult = await db("orders").whereIn("id", orderIds).update({
      repassadoSuperAdmin: 1,
      dataRepasseSuperAdmin: now,
    });

    return res.json({
      success: true,
      message: "Recebíveis marcados como recebidos",
      receivedOrderIds: orderIds,
      dataRepasse: now,
      updateResult,
    });
  } catch (err) {
    console.error("[DEBUG] Erro no POST:", err);
    return res.status(500).json({ error: "Erro interno", details: err.message });
  }
});

// 4. Endpoint GET - Listar recebíveis
router.get("/super-admin/receivables", superAdminAuth, async (req, res) => {
  try {
    // 1. Buscar todos os IDs que já foram marcados em repasses anteriores
    const receivablesRows = await db("super_admin_receivables").select("order_ids");
    let alreadyProcessedIds = [];
    
    for (const row of receivablesRows) {
      if (row.order_ids) {
        try {
          const ids = JSON.parse(row.order_ids);
          if (Array.isArray(ids)) alreadyProcessedIds.push(...ids);
        } catch (e) { /* ignore parse errors */ }
      }
    }

    // 2. Buscar pedidos pagos que NÃO estão na lista de processados
    const paidOrders = await db("orders")
      .whereIn("paymentStatus", ["paid", "authorized"])
      .whereNotIn("id", alreadyProcessedIds)
      .orderBy("timestamp", "desc");

    let totalBrutoReceber = 0;
    const detailedOrders = [];

    for (const order of paidOrders) {
      let items = [];
      try {
        items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || "[]");
      } catch (e) { items = []; }

      const detailedItems = [];
      for (const item of items) {
        let precoBruto = 0;
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

      const orderValueToReceive = detailedItems.reduce((sum, i) => sum + i.valueToReceive, 0);
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

    // 3. Histórico de repasses realizados
    const historyRows = await db("super_admin_receivables")
      .select("id", "amount", "received_at", "order_ids")
      .orderBy("received_at", "desc")
      .limit(20);

    const history = [];
    for (const h of historyRows) {
      let orderIds = [];
      try {
        orderIds = h.order_ids ? JSON.parse(h.order_ids) : [];
      } catch (e) { orderIds = []; }

      // Limpeza de IDs
      orderIds = Array.isArray(orderIds) 
        ? orderIds.filter(id => id && (typeof id === 'string' || typeof id === 'number')) 
        : [];

      if (orderIds.length > 0) {
        const ordersFromHistory = await db("orders").whereIn("id", orderIds);
        ordersFromHistory.forEach(o => {
          history.push({
            repasseId: h.id,
            pedidoId: o.id,
            cliente: o.userName || "-",
            valorTotal: o.total ? parseFloat(o.total) : 0,
            dataPedido: o.timestamp,
            dataRepasse: o.dataRepasseSuperAdmin || h.received_at,
          });
        });
      } else {
        history.push({
          repasseId: h.id,
          pedidoId: "-",
          cliente: "-",
          valorTotal: 0,
          dataPedido: "-",
          dataRepasse: h.received_at,
        });
      }
    }

    const totalAlreadyReceivedSum = await db("super_admin_receivables").sum("amount as total").first();

    return res.json({
      success: true,
      stats: {
        totalToReceive: Math.max(0, totalBrutoReceber),
        totalReceived: totalBrutoReceber,
        alreadyReceived: parseFloat(totalAlreadyReceivedSum.total) || 0,
      },
      history,
      orders: detailedOrders,
    });

  } catch (err) {
    console.error("[DEBUG] Erro no GET:", err);
    return res.status(500).json({ error: "Erro ao buscar dados", details: err.message });
  }
});

export default router;