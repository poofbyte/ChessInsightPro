const { createClient } = require("@libsql/client");

async function run() {
  const client = createClient({ url: "file:apps/web/local.db" });
  await client.execute("DROP TABLE IF EXISTS analytics_events;");
  console.log("Dropped analytics_events table.");
}

run().catch(console.error);
