// Exemplo de implementação de endpoint para o SuperAdmin detalhar pedidos e cálculo de recebíveis
const express = require("express");
const router = express.Router();
const { getAllOrders } = require("../services/paymentService");

// Middleware simples de autenticação por senha
function superAdminAuth(req, res, next) {
  const password = req.headers["x-super-admin-password"];
  if (!password || password !== process.env.SUPER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Endpoint para marcar recebível como recebido
router.post(
  "/super-admin/receivables/mark-received",
  superAdminAuth,
  async (req, res) => {
    try {
      let { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "orderIds obrigatório (array)" });
      }
      const now = new Date().toISOString();
      // Atualiza todos os pedidos marcando como repassados
      await db("orders")
        .whereIn("id", orderIds)
        .update({ repassadoSuperAdmin: 1, dataRepasseSuperAdmin: now });
      return res.json({
        success: true,
        message: "Recebíveis marcados como recebidos",
        receivedOrderIds: orderIds,
        dataRepasse: now,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ error: "Erro interno", details: err.message });
    }
  },
);

// Endpoint detalhado para recebíveis do SuperAdmin
const knex = require("knex");
const path = require("path");
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

// GET recebíveis do SuperAdmin (apenas não repassados)
router.get("/super-admin/receivables", superAdminAuth, async (req, res) => {
  try {
    const orders = await db("orders")
      .whereIn("paymentStatus", ["paid", "authorized"])
      .andWhere(function () {
        this.whereNull("repassadoSuperAdmin").orWhere("repassadoSuperAdmin", 0);
      })
      .orderBy("timestamp", "desc");

    let totalToReceive = 0;
    const detailedOrders = orders.map((order) => {
      const { id, timestamp, userName, total } = order;
      let items = [];
      try {
        items =
          typeof order.items === "string"
            ? JSON.parse(order.items)
            : Array.isArray(order.items)
              ? order.items
              : [];
      } catch (e) {
        items = [];
      }
      let orderValueToReceive = 0;
      const itemDetails = items.map((item) => {
        const price = Number(item.price) || 0;
        const precoBruto = Number(item.precoBruto) || 0;
        const quantity = Number(item.quantity) || 1;
        const valueToReceive = (price - precoBruto) * quantity;
        orderValueToReceive += valueToReceive;
        return {
          name: item.name || "",
          price,
          precoBruto,
          quantity,
          valueToReceive,
        };
      });
      totalToReceive += orderValueToReceive;
      return {
        id,
        timestamp,
        userName,
        total,
        orderValueToReceive,
        items: itemDetails,
      };
    });

    // Histórico de repasses
    const history = await db("orders")
      .where("repassadoSuperAdmin", 1)
      .select(
        "id",
        "timestamp as date",
        "userName",
        "total",
        "dataRepasseSuperAdmin",
      );

    res.json({
      success: true,
      stats: {
        totalToReceive,
        totalReceived: history.reduce((sum, o) => sum + (o.total || 0), 0),
        alreadyReceived: history.length,
      },
      history,
      orders: detailedOrders,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao buscar dados", details: err.message });
  }
});

export default router;
