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

      const updateResult = await db("orders")
        .whereIn("id", orderIds)
        .update({ 
          repassadoSuperAdmin: 1, 
          dataRepasseSuperAdmin: now 
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
      return res.status(500).json({ error: "Erro interno", details: err.message });
    }
  }
);

// 4. Endpoint GET - Listar recebíveis
router.get("/super-admin/receivables", superAdminAuth, async (req, res) => {
  console.log("[DEBUG] GET /super-admin/receivables chamado!");
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
        items = typeof order.items === "string" ? JSON.parse(order.items) : (Array.isArray(order.items) ? order.items : []);
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

    // Histórico de repasses já feitos
    const history = await db("orders")
      .where("repassadoSuperAdmin", 1)
      .select("id", "timestamp", "userName", "total", "dataRepasseSuperAdmin");

    res.json({
      success: true,
      stats: {
        totalToReceive,
        totalReceived: history.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        alreadyReceivedCount: history.length,
      },
      history,
      orders: detailedOrders,
    });
  } catch (err) {
    console.log("[DEBUG] Erro no GET:", err);
    res.status(500).json({ error: "Erro ao buscar dados", details: err.message });
  }
});

module.exports = router;