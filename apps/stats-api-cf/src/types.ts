import type { PrismaClient } from "./generated/prisma/client";

export interface Env {
  DB: D1Database;
  REMOTE: DurableObjectNamespace;
}

/** Hono generics for this Worker: D1/DO bindings + a per-request Prisma client. */
export type AppEnv = {
  Bindings: Env;
  Variables: { prisma: PrismaClient };
};
