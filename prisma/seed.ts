import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // Garde-fou : ce script efface TOUS les users. Ne doit jamais tourner
  // contre la base de prod, même par erreur (mauvais .env local, copier-
  // coller malheureux...). On bloque explicitement si NODE_ENV=production
  // ou si le DATABASE_URL ne ressemble pas à une base locale/dev.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[seed] Refus de tourner avec NODE_ENV=production. " +
        "Ce script efface tous les users — vérifie ton .env avant de forcer.",
    )
  }

  // Wipe all users first
  await prisma.invitationCode.deleteMany()
  await prisma.user.deleteMany()
  console.log("✅ Database wiped")

  const hashedPassword = await bcrypt.hash("test1234", 10)
  
  const admin = await prisma.user.create({
    data: {
      email: "cedric.test@local.dev",
      username: "admin",
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  })

  console.log("✅ Admin user created with username:", admin.username)
  console.log("   Login email: cedric.test@local.dev")
  console.log("   Password: test1234")
  
  const code = await prisma.invitationCode.create({
    data: {
      code: "PANENKA-TEST-2026",
      createdById: admin.id,
    },
  })
  
  console.log("✅ Invitation code created:", code.code)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })