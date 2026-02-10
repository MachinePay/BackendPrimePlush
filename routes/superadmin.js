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
      console.log("[DEBUG] Headers:", req.headers);
      console.log("[DEBUG] Body recebido:", req.body);
      let { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        console.log("[DEBUG] orderIds inválido:", orderIds);
        return res.status(400).json({ error: "orderIds obrigatório (array)" });
      }
      // Aqui você deve atualizar o status de todos os pedidos no banco para 'received'
      // Exemplo genérico:
      // await updateManyOrdersStatus(orderIds, 'received');
      // Simulação:
      const updatedOrderIds = orderIds; // Troque por lógica real
      console.log("[DEBUG] Marcando como recebidos:", updatedOrderIds);
      return res.json({
        success: true,
        message: "Recebíveis marcados como recebidos",
        receivedOrderIds: updatedOrderIds,
      });
    } catch (err) {
      console.log("[DEBUG] Erro interno:", err);
      return res
        .status(500)
        .json({ error: "Erro interno", details: err.message });
    }
  },
);

// Endpoint detalhado para recebíveis do SuperAdmin
router.get("/super-admin/receivables", superAdminAuth, async (req, res) => {
  try {
    // Busca todos os pedidos pagos ou autorizados (Mercado Pago)
    const orders = await getAllOrders({
      paymentStatus: ["paid", "authorized"],
    });

    let totalToReceive = 0;
    const detailedOrders = orders.map((order) => {
      // Informações básicas
      const { id, timestamp, userName, total } = order;
      // Parse dos itens
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
      // Detalhes dos itens e cálculo
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

    // Simule valores já recebidos e recebidos no período
    const alreadyReceived = 0; // Busque do banco se necessário
    const totalReceived = 0; // Busque do banco se necessário
    // Histórico de recebimentos (mock)
    const history = [];
    res.json({
      success: true,
      stats: {
        totalToReceive,
        totalReceived,
        alreadyReceived,
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
