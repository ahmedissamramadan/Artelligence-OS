import { Database } from "bun:sqlite";

const dbPath = "/Users/ahmedissamramadan/.gemini/antigravity/scratch/local-context-broker/context.db";
const action = process.argv[2];

try {
  const db = new Database(dbPath);

  if (action === "list") {
    const catalogs = db.query("SELECT * FROM upwork_catalogs").all();
    console.log(JSON.stringify(catalogs));
  } else if (action === "logs") {
    const logs = db.query("SELECT * FROM custom_logs ORDER BY id DESC LIMIT 20").all();
    console.log(JSON.stringify(logs));
  } else if (action === "update") {
    const id = process.argv[3];
    const status = process.argv[4];
    db.query("UPDATE upwork_catalogs SET status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
    console.log(JSON.stringify({ success: true }));
  } else {
    console.log(JSON.stringify({ error: "Unknown action" }));
  }
} catch (err) {
  console.log(JSON.stringify({ error: err.message }));
}
