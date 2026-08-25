import "dotenv/config";
import { client, db } from "../src/db";
import { creators, widgets, testimonials } from "../src/db/schema";
import { performance } from "perf_hooks";

async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const res = await fn();
  const duration = (performance.now() - start).toFixed(1);
  console.log(`⏱️  [${label}]: ${duration}ms`);
  return res;
}

async function main() {
  console.log("\n=======================================================");
  console.log("🚀 CLIENTECHO SYSTEM LATENCY & BOTTLENECK PROFILER");
  console.log("=======================================================\n");

  // 1. Raw DB Handshake & Ping
  try {
    await measure("1. Raw PostgreSQL TCP Handshake & 'SELECT 1'", async () => {
      return await client`SELECT 1 as ping`;
    });
  } catch (err: any) {
    console.error("❌ DB Ping Error:", err.message);
  }

  // 2. Second Query on Warm Connection Pool
  try {
    await measure("2. Warm Pool 'SELECT 1' (Testing Connection Reuse)", async () => {
      return await client`SELECT 1 as ping`;
    });
  } catch (err: any) {
    console.error("❌ Warm DB Ping Error:", err.message);
  }

  // 3. Schema Drizzle Queries
  try {
    await measure("3. Drizzle ORM Creators Select", async () => {
      return await db.select().from(creators).limit(10);
    });
  } catch (err: any) {
    console.error("❌ Drizzle Creators Query Error:", err.message);
  }

  // 4. Supabase HTTPS Auth Endpoint Ping
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      await measure("4. Supabase Auth HTTPS REST Roundtrip", async () => {
        const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
        });
        return await res.json();
      });
    } catch (err: any) {
      console.error("❌ Supabase Auth Health Error:", err.message);
    }
  }

  // 5. Upstash Redis REST Ping
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    try {
      await measure("5. Upstash Redis REST API Ping", async () => {
        const res = await fetch(`${upstashUrl}/ping`, {
          headers: {
            Authorization: `Bearer ${upstashToken}`,
          },
        });
        return await res.json();
      });
    } catch (err: any) {
      console.error("❌ Upstash Redis Ping Error:", err.message);
    }
  }

  console.log("\n=======================================================\n");
  await client.end();
}

main().then(() => process.exit(0));
