import "dotenv/config"
import { prisma } from "../src/lib/prisma"

const POINTS_PRESENT = 5
const POINTS_EXACT_PLACE = 5

async function main() {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  })
  if (!season) {
    console.log("Aucune saison active.")
    return
  }
  console.log(`Saison : ${season.name}`)

  // Top 3 buteurs en DB
  const top3 = await prisma.scorer.findMany({
    where: { seasonId: season.id, rank: { lte: 3 } },
    orderBy: { rank: "asc" },
    select: { rank: true, teamId: true, name: true },
  })
  if (top3.length === 0) {
    console.log("Pas de top 3 buteurs en DB.")
    return
  }
console.log("Top 3 buteurs :", top3.map((s: { rank: number; name: string }) => `${s.rank}. ${s.name}`).join(", "))

  // On cherche les IDs Player correspondants (match par nom + équipe)
  const top3Players = await Promise.all(
    top3.map(async (scorer) => {
      const player = await prisma.player.findFirst({
        where: {
          name: { equals: scorer.name, mode: "insensitive" },
          teamId: scorer.teamId,
        },
        select: { id: true },
      })
      if (!player) console.warn(`⚠️  Joueur introuvable en DB : ${scorer.name}`)
      return { rank: scorer.rank, playerId: player?.id ?? null }
    }),
  )

  const playerIdByRank = new Map(
    top3Players
      .filter((p) => p.playerId !== null)
      .map((p) => [p.rank, p.playerId!]),
  )
  const top3PlayerIds = new Set(playerIdByRank.values())

  // Tous les users qui ont des picks Golden Boot
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { goldenBoot1stPlayerId: { not: null } },
        { goldenBoot2ndPlayerId: { not: null } },
        { goldenBoot3rdPlayerId: { not: null } },
      ],
    },
    select: {
      id: true,
      username: true,
      goldenBoot1stPlayerId: true,
      goldenBoot2ndPlayerId: true,
      goldenBoot3rdPlayerId: true,
    },
  })

  if (users.length === 0) {
    console.log("Aucun user avec des picks Golden Boot.")
    return
  }

  let usersUpdated = 0
  for (const user of users) {
    const picks = [
      { rank: 1, playerId: user.goldenBoot1stPlayerId },
      { rank: 2, playerId: user.goldenBoot2ndPlayerId },
      { rank: 3, playerId: user.goldenBoot3rdPlayerId },
    ]

    let points = 0
    for (const pick of picks) {
      if (!pick.playerId) continue
      if (top3PlayerIds.has(pick.playerId)) {
        points += POINTS_PRESENT
        if (playerIdByRank.get(pick.rank) === pick.playerId) {
          points += POINTS_EXACT_PLACE
        }
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { goldenBootPoints: points },
    })

    console.log(`✓ ${user.username} → ${points} pts Golden Boot`)
    usersUpdated++
  }

  console.log(`\n✅ ${usersUpdated} users mis à jour.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())