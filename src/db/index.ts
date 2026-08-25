import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * High-Performance Supabase Serverless & Dev Pool Singleton:
 * In serverless/production contexts (e.g. Next.js on Vercel) and local HMR dev mode,
 * reusing the postgres client instance on globalThis prevents connection leaks,
 * socket starvation, and slow TCP handshakes to PgBouncer (port 6543).
 */
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/clientecho";

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var _drizzleDb: ReturnType<typeof drizzle> | undefined;
}

export const client =
  globalThis._pgClient ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    prepare: false, // Required for Supabase Transaction Pooler (PgBouncer port 6543)
    idle_timeout: 30, // Close idle connections after 30 seconds
    connect_timeout: 10, // 10s connection timeout
    max_lifetime: 60 * 30, // 30 minutes connection recycling
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._pgClient = client;
}

export const db =
  globalThis._drizzleDb ??
  drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis._drizzleDb = db;
}
