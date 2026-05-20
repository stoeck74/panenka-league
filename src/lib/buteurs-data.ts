// ============================================
// BUTEURS DATA
// ============================================
// Lit le top buteurs de la saison active depuis la DB.

import { prisma } from "@/lib/prisma"

const TOP_N = 15

export type ButeurEntry = {
  rank: number
  scorerId: string
  name: string
  goals: number
  team: {
    name: string
    shortName: string
    tla: string
    crestUrl: string | null
  }
}

export async function getButeurs(): Promise<ButeurEntry[]> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return []

  const scorers = await prisma.scorer.findMany({
    where: {
      seasonId: season.id,
      rank: { lte: TOP_N },
    },
    orderBy: { rank: "asc" },
    include: {
      team: {
        select: {
          name: true,
          shortName: true,
          tla: true,
          crestUrl: true,
        },
      },
    },
  })

  return scorers.map((s) => ({
    rank: s.rank,
    scorerId: s.id,
    name: s.name,
    goals: s.goals,
    team: s.team,
  }))
}