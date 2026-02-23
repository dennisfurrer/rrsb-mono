/**
 * Seed script: creates default location, initial super admin user,
 * and a default names list from the bundled spielerliste.csv.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts --email admin@rrsb.ch --password <password>
 *   npx tsx scripts/seed-admin.ts --email admin@rrsb.ch --password <password> --db postgres://user:pass@host/db
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const { hash } = bcrypt;
const __dirname = dirname(fileURLToPath(import.meta.url));

const dbIdx = process.argv.indexOf("--db");
const connectionString =
  (dbIdx !== -1 ? process.argv[dbIdx + 1] : undefined) ??
  process.env.POSTGRES_URL ??
  "postgres://rrsb@localhost:5432/scoreboard-db-v3";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function parseSpielerlisteCsv(): { playerName: string; nationalityIOC: string }[] {
  const csvPath = resolve(
    __dirname,
    "../../../apps/scoreboard-ui/src/assets/spielerliste.csv"
  );
  const raw = readFileSync(csvPath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const entries: { playerName: string; nationalityIOC: string }[] = [];

  // Skip header (line 0); lines 1-3 are test players (N° = 1,2,3)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const num = parseInt(cols[0], 10);
    if (num <= 3) continue; // skip test players

    const playerName = (cols[4] || "").trim();
    if (!playerName) continue;

    let ioc = (cols[24] || "").trim();
    if (ioc === "#NV" || ioc === "") ioc = "";

    entries.push({ playerName, nationalityIOC: ioc });
  }

  return entries;
}

async function main() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf("--email");
  const passIdx = args.indexOf("--password");

  if (emailIdx === -1 || passIdx === -1) {
    console.error(
      "Usage: npx tsx scripts/seed-admin.ts --email <email> --password <password>"
    );
    process.exit(1);
  }

  const email = args[emailIdx + 1];
  const password = args[passIdx + 1];

  if (!email || !password) {
    console.error("Email and password are required.");
    process.exit(1);
  }

  // Create default location
  const location = await prisma.location.upsert({
    where: { slug: "round-robin" },
    update: {},
    create: {
      name: "Round Robin",
      slug: "round-robin",
      isDefault: true,
    },
  });
  console.log(`Location: ${location.name} (${location.id})`);

  // Create super admin user
  const passwordHash = await hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "SUPER_ADMIN" },
    create: {
      email,
      passwordHash,
      displayName: "Super Admin",
      role: "SUPER_ADMIN",
      locationId: location.id,
    },
  });
  console.log(`Super Admin: ${user.email} (${user.id})`);

  // Seed default names list from bundled spielerliste.csv
  const csvEntries = parseSpielerlisteCsv();
  console.log(`Parsed ${csvEntries.length} players from spielerliste.csv`);

  const existingList = await prisma.namesList.findFirst({
    where: { name: "Round Robin Spielerliste" },
  });

  if (existingList) {
    console.log(`Names list already exists: ${existingList.name} (${existingList.id}) — skipping`);
  } else {
    const namesList = await prisma.namesList.create({
      data: {
        name: "Round Robin Spielerliste",
        locationId: location.id,
        entries: {
          create: csvEntries.map((e, i) => ({
            playerName: e.playerName,
            nationalityIOC: e.nationalityIOC,
            sortOrder: i,
          })),
        },
      },
    });
    console.log(`Names list: ${namesList.name} (${namesList.id}) — ${csvEntries.length} entries`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
