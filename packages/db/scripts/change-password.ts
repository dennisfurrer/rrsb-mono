import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      "postgresql://rrsb_v3_user:YKZg0zB8CmUnQNqnslwT5NBsvIhP5PbF@dpg-d6ds7unpm1nc73a1hc20-a.oregon-postgres.render.com/rrsb_v3?sslmode=require",
  }),
});

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, displayName: true },
  });
  console.log("Users in database:");
  users.forEach((u) =>
    console.log(`  ${u.email} | ${u.role} | ${u.displayName} | ${u.id}`)
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
