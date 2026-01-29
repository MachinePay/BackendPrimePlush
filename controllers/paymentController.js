import * as paymentService from "../services/paymentService.js";



/**
 * POST /api/payment/create-pix
 * Criar pagamento PIX (QR Code)
 */
  try {
    const { amount, description, orderId, email, payerName } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Campo amount é obrigatório" });
    }
    const result = await paymentService.createPixPayment(
      { amount, description, orderId, email, payerName },
      req.store
    );
    return res.json(result);
  } catch (error) {
    console.error("[Controller] Erro ao criar PIX:", error);
    return res
      .status(500)
      .json({ error: error.message || "Erro ao criar PIX" });
  }
}

/**
 * POST /api/payment/create
 * Criar pagamento com cartão via Point
 */
  try {
    const { amount, description, orderId } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Campo amount é obrigatório" });
    }
    if (!req.store.mp_device_id) {
      return res
        .status(400)
        .json({ error: "Device ID não configurado para esta loja" });
    }
    const result = await paymentService.createCardPayment(
      { amount, description, orderId },
      req.store
    );
    return res.json(result);
  } catch (error) {
    console.error("[Controller] Erro ao criar pagamento com cartão:", error);
    return res
      .status(500)
      .json({ error: error.message || "Erro ao criar pagamento" });
  }
}

/**
 * GET /api/payment/status/:paymentId
 * Verificar status de pagamento
 */
  try {
    const { paymentId } = req.params;
    if (!paymentId) {
      return res.status(400).json({ error: "paymentId é obrigatório" });
    }
    const result = await paymentService.checkPaymentStatus(
      paymentId,
      req.store
    );
    return res.json(result);
  } catch (error) {
    console.error("[Controller] Erro ao verificar status:", error);
    return res
      .status(500)
      .json({ error: error.message || "Erro ao verificar pagamento" });
  }
}

/**
 * DELETE /api/payment/cancel/:paymentId
 * Cancelar pagamento
 */
  try {
    const { paymentId } = req.params;
    if (!paymentId) {
      return res.status(400).json({ error: "paymentId é obrigatório" });
    }
    const result = await paymentService.cancelPayment(paymentId, req.store);
    return res.json(result);
  } catch (error) {
    console.error("[Controller] Erro ao cancelar pagamento:", error);
    return res
      .status(500)
      .json({ error: error.message || "Erro ao cancelar pagamento" });
  }
}

/**
 * POST /api/payment/point/configure
 * Configurar Point em modo PDV
 */
  try {
    if (!req.store.mp_device_id) {
      return res
        .status(400)
        .json({ error: "Device ID não configurado para esta loja" });
    }
    const result = await paymentService.configurePoint(req.store);
    return res.json(result);
  } catch (error) {
    console.error("[Controller] Erro ao configurar Point:", error);
    return res
      .status(500)
      .json({ error: error.message || "Erro ao configurar Point" });
  }
}

/**
 * GET /api/payment/point/status
 * Obter status da Point
 */
  try {
    if (!req.store.mp_device_id) {
      return res
        .status(400)
        .json({ error: "Device ID não configurado para esta loja" });
    }
    const result = await paymentService.getPointStatus(req.store);
    return res.json(result);
  } catch (error) {
    console.error("[Controller] Erro ao consultar Point:", error);
    return res
      .status(500)
      .json({ error: error.message || "Erro ao consultar Point" });
  }
}

/**
 * POST /api/payment/clear-queue
 * Limpar fila de pagamentos pendentes
 */
  try {
    if (!req.store.mp_device_id) {
      return res
        .status(400)
        .json({ error: "Device ID não configurado para esta loja" });
    }
    const result = await paymentService.clearPaymentQueue(req.store);
    return res.json(result);
  } catch (error) {
    console.error("[Controller] Erro ao limpar fila:", error);
    return res
      .status(500)
      .json({ error: error.message || "Erro ao limpar fila" });
  }
}
