import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Supabase Serverless & Connection Pooling Configuration:
 * In serverless/production contexts (e.g. Next.js on Vercel), DATABASE_URL MUST use
 * Supabase Transaction Pooler (PgBouncer) on port 6543 (not direct port 5432).
 * `prepare: false` is required because PgBouncer does not support prepared statements across pooled connections.
 * `max: 1` ensures each serverless function instance does not exhaust pooled connections.
 */
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/clientecho";

export const client = postgres(connectionString, { 
  max: process.env.NODE_ENV === "production" ? 1 : 5,
  prepare: false, // Required for Supabase Transaction Pooler (PgBouncer)
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

