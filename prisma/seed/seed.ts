import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("🌱 Iniciando seed...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@vitalis.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@vitalis.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin creado: admin@vitalis.com / admin123");

  const clientPassword = await bcrypt.hash("cliente123", 12);
  const client = await prisma.user.upsert({
    where: { email: "cliente@vitalis.com" },
    update: {},
    create: {
      name: "Cliente Demo",
      email: "cliente@vitalis.com",
      password: clientPassword,
      role: "CLIENT",
      subscriptionStatus: "ACTIVE",
    },
  });
  console.log("✅ Cliente creado: cliente@vitalis.com / cliente123");

  const slots = [
    { dayOfWeek: 1, startTime: "08:00", endTime: "09:00", maxCapacity: 5 },
    { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", maxCapacity: 5 },
    { dayOfWeek: 1, startTime: "17:00", endTime: "18:00", maxCapacity: 5 },
    { dayOfWeek: 2, startTime: "08:00", endTime: "09:00", maxCapacity: 5 },
    { dayOfWeek: 2, startTime: "18:00", endTime: "19:00", maxCapacity: 5 },
    { dayOfWeek: 3, startTime: "08:00", endTime: "09:00", maxCapacity: 5 },
    { dayOfWeek: 3, startTime: "17:00", endTime: "18:00", maxCapacity: 5 },
    { dayOfWeek: 4, startTime: "09:00", endTime: "10:00", maxCapacity: 5 },
    { dayOfWeek: 4, startTime: "18:00", endTime: "19:00", maxCapacity: 5 },
    { dayOfWeek: 5, startTime: "08:00", endTime: "09:00", maxCapacity: 5 },
    { dayOfWeek: 5, startTime: "17:00", endTime: "18:00", maxCapacity: 5 },
  ];

  let createdSlots = 0;
  for (const slot of slots) {
    const existing = await prisma.scheduleSlot.findFirst({
      where: {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    });
    if (!existing) {
      await prisma.scheduleSlot.create({ data: slot });
      createdSlots++;
    }
  }
  console.log(`✅ ${createdSlots} horarios semanales creados`);

  console.log("\n📋 Resumen:");
  console.log("  Admin: admin@vitalis.com / admin123");
  console.log("  Cliente: cliente@vitalis.com / cliente123");
  console.log(`  Horarios: ${createdSlots} slots creados`);
  console.log("\n⚠️  Recuerda generar las sesiones del mes desde el panel de admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
