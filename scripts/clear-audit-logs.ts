import "dotenv/config";
import { client, db } from "../src/db";
import { adminAuditLog } from "../src/db/schema";

async function main() {
  console.log("Truncating / clearing admin_audit_log table data...");
  await client`TRUNCATE TABLE "admin_audit_log" RESTART IDENTITY;`;
  
  const remaining = await db.select().from(adminAuditLog);
  console.log(`✅ Table cleared. Total audit log entries remaining: ${remaining.length}`);
  
  await client.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error clearing logs:", err);
    process.exit(1);
  });
