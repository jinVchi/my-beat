import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForDb = globalThis as typeof globalThis & {
  dbPool?: Pool;
};

const pool =
  globalForDb.dbPool ??
  createPool({
    uri: connectionString,
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = pool;
}

export const db = drizzle({
  client: pool,
  schema,
  mode: "default",
});

export type Database = typeof db;
