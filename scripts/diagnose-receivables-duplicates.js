// Script de DIAGNÓSTICO (somente leitura) para o bug de repasses duplicados
// ao SuperAdmin. Lista pedidos que aparecem em mais de uma linha de
// super_admin_receivables e quanto do total "Já pago" é duplicata.
//
// Uso:
//   Produção (Postgres): DATABASE_URL=postgres://... node scripts/diagnose-receivables-duplicates.js
//   Local (sqlite):       node scripts/diagnose-receivables-duplicates.js
import "dotenv/config";
import knex from "knex";
import path from "path";

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

const run = async () => {
  const rows = await db("super_admin_receivables")
    .select("id", "amount", "order_ids", "received_at")
    .orderBy("received_at", "asc");

  console.log(`Linhas em super_admin_receivables: ${rows.length}`);

  const totalSum = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  console.log(`Soma de "amount" (o que hoje aparece como "Já pago"): R$ ${totalSum.toFixed(2)}`);

  // Mapeia cada order_id -> lista de linhas (repasseId, amount, received_at) em que ele aparece
  const orderToRows = new Map();
  rows.forEach((r) => {
    let ids = [];
    try {
      ids = JSON.parse(r.order_ids || "[]");
    } catch (e) {
      ids = [];
    }
    ids.forEach((id) => {
      const key = String(id);
      if (!orderToRows.has(key)) orderToRows.set(key, []);
      orderToRows.get(key).push({
        repasseId: r.id,
        amount: parseFloat(r.amount) || 0,
        received_at: r.received_at,
      });
    });
  });

  const duplicated = [...orderToRows.entries()].filter(
    ([, occurrences]) => occurrences.length > 1,
  );

  console.log(`\nPedidos que aparecem em mais de uma linha de repasse: ${duplicated.length}`);

  // Linhas inteiras que são candidatas a "duplicata a remover":
  // para cada pedido duplicado, todas as ocorrências exceto a mais antiga.
  const rowsToReview = new Map(); // repasseId -> row
  duplicated.forEach(([orderId, occurrences]) => {
    const sorted = [...occurrences].sort(
      (a, b) => new Date(a.received_at) - new Date(b.received_at),
    );
    console.log(`\n  Pedido ${orderId}:`);
    sorted.forEach((occ, idx) => {
      const tag = idx === 0 ? "MANTER (mais antiga)" : "CANDIDATA A DUPLICATA";
      console.log(
        `    - repasseId=${occ.repasseId} amount=R$${occ.amount.toFixed(2)} received_at=${occ.received_at} [${tag}]`,
      );
      if (idx > 0) rowsToReview.set(occ.repasseId, occ);
    });
  });

  const duplicateRowsAmount = [...rowsToReview.values()].reduce(
    (s, r) => s + r.amount,
    0,
  );

  console.log(`\nLinhas de repasse (repasseId) candidatas a duplicata: ${rowsToReview.size}`);
  console.log(
    `Valor somado dessas linhas candidatas (o que estaria inflando o "Já pago"): R$ ${duplicateRowsAmount.toFixed(2)}`,
  );
  console.log(
    `"Já pago" corrigido estimado (sem as candidatas): R$ ${(totalSum - duplicateRowsAmount).toFixed(2)}`,
  );

  console.log(
    "\nATENÇÃO: este script é apenas diagnóstico, não apaga nada. " +
      "Revise a lista acima antes de decidir remover qualquer linha de super_admin_receivables.",
  );

  await db.destroy();
};

run().catch((err) => {
  console.error("Erro ao diagnosticar duplicatas:", err);
  process.exit(1);
});
