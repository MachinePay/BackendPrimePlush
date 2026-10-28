/**
 * fixAdminSalesStock.js
 *
 * Corrige vendas feitas pelo admin (deductOnDelivery) que foram entregues mas
 * não descontaram o estoque. Se o pedido fosse marcado como pago antes de
 * entregar, a entrega não baixava nada.
 *
 * A fonte da verdade é a tabela stock_movements: para cada item vendido pelo
 * admin, compara a quantidade ENTREGUE com o que de fato saiu do estoque
 * (movimentações "sale" daquele pedido) e desconta a diferença. O que ainda
 * não foi entregue não desconta, mas passa a ficar reservado (conta no
 * disponível, igual aos pedidos novos).
 *
 * Uso:
 *   node -r dotenv/config scripts/fixAdminSalesStock.js           -> só mostra (não altera nada)
 *   node -r dotenv/config scripts/fixAdminSalesStock.js --apply   -> aplica a correção
 *   node -r dotenv/config scripts/fixAdminSalesStock.js --history 7 -> mostra também as movimentações dos últimos 7 dias
 *
 * Pode rodar mais de uma vez: o que já foi corrigido não é mexido de novo.
 */

import knex from "knex";
import dotenv from "dotenv";
dotenv.config();

const APPLY = process.argv.includes("--apply");
const historyIdx = process.argv.indexOf("--history");
const HISTORY_DAYS =
  historyIdx >= 0 ? parseInt(process.argv[historyIdx + 1]) || 7 : 0;

const db = knex(
  process.env.DATABASE_URL
    ? {
        client: "pg",
        connection: {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        },
      }
    : {
        client: "sqlite3",
        connection: { filename: "./data/kiosk.sqlite" },
        useNullAsDefault: true,
      },
);

const parseJSON = (data) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return data || [];
};

const isCanceled = (order) =>
  order.status === "canceled" || order.paymentStatus === "canceled";

// Quanto do item já foi entregue (mesma regra do mark-delivered)
const getDelivered = (order, item) => {
  if (item.deliveredQuantity !== undefined && item.deliveredQuantity !== null) {
    return Number(item.deliveredQuantity) || 0;
  }
  return order.entregueCliente == 1 ? Number(item.quantity) || 0 : 0;
};

async function printHistory() {
  const since = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const rows = await db("stock_movements")
    .where("created_at", ">=", since)
    .orderBy("created_at", "asc");
  console.log(`\n=== Movimentações de estoque (últimos ${HISTORY_DAYS} dias) ===`);
  for (const r of rows) {
    console.log(
      `${new Date(r.created_at).toLocaleString("pt-BR")} | ${String(r.type).padEnd(15)} | ${String(r.quantity).padStart(5)} | ${r.productName} | ${r.stock_before ?? "?"} → ${r.stock_after ?? "?"} | pedido ${r.orderId || "-"}`,
    );
  }
}

async function main() {
  if (HISTORY_DAYS) await printHistory();

  const orders = await db("orders")
    .where("deductOnDelivery", true)
    .orderBy("timestamp", "asc");

  // Por produto: quanto falta descontar e quanto falta reservar
  const perProduct = new Map();
  const fixes = [];

  for (const order of orders) {
    if (isCanceled(order)) continue;
    const items = parseJSON(order.items);
    // Só vendas antigas do admin (itens marcados reserved:false)
    if (!items.some((item) => item.reserved === false)) continue;

    const movements = await db("stock_movements")
      .where({ orderId: order.id })
      .where("type", "sale");
    const deductedByProduct = new Map();
    for (const m of movements) {
      deductedByProduct.set(
        m.productId,
        (deductedByProduct.get(m.productId) || 0) - (Number(m.quantity) || 0),
      );
    }

    const byProduct = new Map();
    for (const item of items) {
      if (item.reserved !== false) continue;
      const acc = byProduct.get(item.id) || {
        name: item.name,
        delivered: 0,
        pending: 0,
      };
      const delivered = getDelivered(order, item);
      acc.delivered += delivered;
      acc.pending += Math.max(0, (Number(item.quantity) || 0) - delivered);
      byProduct.set(item.id, acc);
    }

    const orderFixes = [];
    for (const [productId, { name, delivered, pending }] of byProduct) {
      const deducted = deductedByProduct.get(productId) || 0;
      const missing = delivered - deducted;
      if (missing === 0 && pending === 0) continue;
      orderFixes.push({ productId, name, delivered, deducted, missing, pending });
      const acc = perProduct.get(productId) || { name, missing: 0, pending: 0 };
      acc.missing += missing;
      acc.pending += pending;
      perProduct.set(productId, acc);
    }

    // Mesmo sem nada a corrigir, o pedido é convertido (sai o reserved:false)
    fixes.push({ order, items, orderFixes });
    if (orderFixes.length > 0) {
      console.log(
        `\nPedido ${order.id} | ${order.userName} | ${new Date(order.timestamp).toLocaleString("pt-BR")} | pagamento: ${order.paymentStatus} | entregue: ${order.entregueCliente ? "sim" : "não"}`,
      );
      for (const f of orderFixes) {
        const parts = [];
        if (f.missing > 0) parts.push(`FALTA DESCONTAR ${f.missing}`);
        if (f.missing < 0) parts.push(`DESCONTADO A MAIS ${-f.missing}`);
        if (f.pending > 0) parts.push(`RESERVAR ${f.pending} (falta entregar)`);
        console.log(
          `   ${f.name}: entregue ${f.delivered}, saiu do estoque ${f.deducted} → ${parts.join(", ")}`,
        );
      }
    }
  }

  if (fixes.length === 0) {
    console.log("\n✅ Nenhuma venda do admin com estoque pendente.");
    return;
  }

  console.log("\n=== Resumo por produto ===");
  for (const [productId, { name, missing, pending }] of perProduct) {
    const product = await db("products").where({ id: productId }).first();
    if (!product || product.stock === null) continue;
    const stock = Number(product.stock);
    const reserved = Number(product.stock_reserved) || 0;
    const newStock = stock - Math.max(0, missing);
    const newReserved = reserved + pending;
    console.log(
      `${name}: estoque ${stock} → ${newStock} | reservado ${reserved} → ${newReserved} | disponível ${stock - reserved} → ${newStock - newReserved}`,
    );
  }

  if (!APPLY) {
    console.log(
      "\nNada foi alterado. Confira acima e rode com --apply para corrigir.",
    );
    return;
  }

  console.log("\nAplicando correção...");
  for (const { order, items, orderFixes } of fixes) {
    await db.transaction(async (trx) => {
      for (const f of orderFixes) {
        const product = await trx("products").where({ id: f.productId }).first();
        if (!product || product.stock === null) continue;
        // Só corrige o que faltou descontar; descontado a mais fica para
        // conferência manual
        if (f.missing > 0) {
          await trx("products")
            .where({ id: f.productId })
            .decrement("stock", f.missing);
          const after = await trx("products").where({ id: f.productId }).first();
          await trx("stock_movements").insert({
            productId: f.productId,
            productName: f.name,
            quantity: -f.missing,
            type: "sale",
            orderId: order.id,
            stock_before: Number(after.stock) + f.missing,
            stock_after: Number(after.stock),
            created_at: new Date(),
          });
          console.log(
            `   ✅ ${f.name}: estoque ${Number(after.stock) + f.missing} → ${after.stock} (pedido ${order.id})`,
          );
        }
        if (f.pending > 0) {
          await trx("products")
            .where({ id: f.productId })
            .increment("stock_reserved", f.pending);
          console.log(
            `   🔒 ${f.name}: reservado +${f.pending} (pedido ${order.id})`,
          );
        }
      }

      // Itens passam a segurar reserva como os pedidos novos; stockDeducted =
      // entregue, para a próxima entrega descontar só o resto
      const updatedItems = items.map((item) => {
        if (item.reserved !== false) return item;
        const { reserved, ...rest } = item;
        return { ...rest, stockDeducted: getDelivered(order, item) };
      });
      await trx("orders")
        .where({ id: order.id })
        .update({ items: JSON.stringify(updatedItems) });
    });
  }
  console.log("\n✅ Correção aplicada.");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
