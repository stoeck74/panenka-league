import { prisma } from "./src/lib/prisma"
async function main() {
  const teams = await prisma.team.findMany({ select: { name: true, externalId: true }, orderBy: { name: "asc" } })
  console.log(JSON.stringify(teams, null, 2))
  await prisma.$disconnect()
}
main()
