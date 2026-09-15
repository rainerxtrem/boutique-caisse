import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "Boissons", slug: "boissons" },
  { name: "Fromages", slug: "fromages" },
  { name: "Sandwichs", slug: "sandwichs" },
];

const PRODUCTS = [
  {
    name: "Coca Cola",
    slug: "coca-cola",
    description: "Canette 33cl",
    price: 2.5,
    stock: 120,
    sku: "BOI-001",
    categorySlug: "boissons",
  },
  {
    name: "Goat Cheese",
    slug: "goat-cheese",
    description: "Sandwich au chèvre, miel et noix",
    price: 6.9,
    stock: 25,
    sku: "SDW-001",
    categorySlug: "sandwichs",
  },
  {
    name: "Oriental",
    slug: "oriental",
    description: "Sandwich poulet épicé, crudités, sauce oriental",
    price: 7.2,
    stock: 30,
    sku: "SDW-002",
    categorySlug: "sandwichs",
  },
  {
    name: "Chicken",
    slug: "chicken",
    description: "Sandwich poulet grillé, salade, tomate",
    price: 6.5,
    stock: 40,
    sku: "SDW-003",
    categorySlug: "sandwichs",
  },
  {
    name: "3 Cheeses",
    slug: "3-cheeses",
    description: "Sandwich trois fromages, comté, chèvre, emmental",
    price: 7.5,
    stock: 20,
    sku: "SDW-004",
    categorySlug: "sandwichs",
  },
  {
    name: "Smokehouse",
    slug: "smokehouse",
    description: "Sandwich bacon fumé, cheddar, sauce BBQ",
    price: 7.9,
    stock: 18,
    sku: "SDW-005",
    categorySlug: "sandwichs",
  },
  {
    name: "Comté 18 mois",
    slug: "comte-18-mois",
    description: "Part de comté affiné 18 mois, 200g",
    price: 5.4,
    stock: 15,
    sku: "FRO-001",
    categorySlug: "fromages",
  },
  {
    name: "Eau minérale",
    slug: "eau-minerale",
    description: "Bouteille 50cl",
    price: 1.5,
    stock: 200,
    sku: "BOI-002",
    categorySlug: "boissons",
  },
];

async function main() {
  console.log("Seeding database...");

  const categories = new Map<string, string>();
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
    categories.set(c.slug, category.id);
  }

  for (const p of PRODUCTS) {
    const { categorySlug, ...data } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        ...data,
        categoryId: categories.get(categorySlug),
      },
      create: {
        ...data,
        categoryId: categories.get(categorySlug),
      },
    });
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
  const vendeurPassword = process.env.SEED_VENDEUR_PASSWORD ?? "Vendeur1234!";

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "Administrateur",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  await prisma.user.upsert({
    where: { username: "vendeur" },
    update: {},
    create: {
      username: "vendeur",
      name: "Vendeur Caisse",
      role: "VENDEUR",
      passwordHash: await bcrypt.hash(vendeurPassword, 10),
    },
  });

  await prisma.customer.upsert({
    where: { phone: "0600000000" },
    update: {},
    create: {
      firstName: "Client",
      lastName: "Test",
      birthDate: new Date("1990-01-01"),
      phone: "0600000000",
      points: 12,
    },
  });

  console.log("Seed terminé.");
  console.log(`Compte admin: admin / ${adminPassword}`);
  console.log(`Compte vendeur: vendeur / ${vendeurPassword}`);
  console.log("Client fidélité de test: 0600000000");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
