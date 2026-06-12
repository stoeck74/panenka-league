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
  photoUrl: string | null
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

// On cherche la photo du joueur via le model Player (match par nom + équipe)
  const playersWithPhotos = await prisma.player.findMany({
    where: {
      teamId: { in: scorers.map((s) => s.teamId) },
      photoUrl: { not: null },
    },
    select: { name: true, teamId: true, photoUrl: true },
  })

  // Index par "nom normalisé + teamId" pour lookup rapide
  const photoIndex = new Map<string, string>()
  for (const p of playersWithPhotos) {
    const key = `${p.name.toLowerCase().trim()}-${p.teamId}`
    if (p.photoUrl) photoIndex.set(key, p.photoUrl)
  }

  return scorers.map((s) => {
    const key = `${s.name.toLowerCase().trim()}-${s.teamId}`
    return {
      rank: s.rank,
      scorerId: s.id,
      name: s.name,
      goals: s.goals,
      photoUrl: photoIndex.get(key) ?? null,
      team: s.team,
    }
  })
}