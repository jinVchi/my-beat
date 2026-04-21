import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type Pool as PgPool } from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForDb = globalThis as typeof globalThis & {
  dbPool?: PgPool;
};

const pool =
  globalForDb.dbPool ??
  new Pool({
    connectionString,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = pool;
}

export const db = drizzle({
  client: pool,
  schema,
});

export type Database = typeof db;
