import knex from "knex";

const db = knex({
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
});

const IDS_TO_DELETE = [21, 22, 23, 24, 25, 26];

const run = async () => {
  const before = await db("super_admin_receivables")
    .select("id", "amount")
    .orderBy("id");
  console.log("Antes:", before);

  const deleted = await db("super_admin_receivables")
    .whereIn("id", IDS_TO_DELETE)
    .del();
  console.log("Linhas deletadas:", deleted);

  const after = await db("super_admin_receivables")
    .select("id", "amount")
    .orderBy("id");
  console.log("Depois:", after);

  const sum = await db("super_admin_receivables").sum("amount as total").first();
  console.log("Novo total (Já pago):", sum.total);

  await db.destroy();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
