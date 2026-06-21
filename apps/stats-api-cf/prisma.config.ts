import { defineConfig } from "prisma/config";

// Local-only datasource for the Prisma CLI (schema validation + `migrate diff`
// to generate D1 migration SQL). At runtime the Worker uses the D1 driver adapter,
// not this URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "file:./prisma/dev.db",
  },
});
