import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"
import { findPlayerIdForScorer } from "@/lib/golden-boot-matching"

const POINTS_PRESENT = 5
const POINTS_EXACT_PLACE = 5

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const season = await prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    })
    if (!season) {
      return NextResponse.json({ ok: false, error: "Aucune saison active" })
    }

    // Top 3 buteurs en DB
    const top3 = await prisma.scorer.findMany({
      where: { seasonId: season.id, rank: { lte: 3 } },
      orderBy: { rank: "asc" },
      select: { rank: true, teamId: true, name: true },
    })
    if (top3.length === 0) {
      return NextResponse.json({ ok: false, error: "Pas de top 3 buteurs en DB" })
    }

    // Trouver les IDs Player correspondants (avec fallback nom normalisé)
    const top3Players = await Promise.all(
      top3.map(async (scorer) => {
        const playerId = await findPlayerIdForScorer(scorer.name, scorer.teamId)
        return { rank: scorer.rank, playerId }
      }),
    )

    const playerIdByRank = new Map(
      top3Players.filter((p) => p.playerId !== null).map((p) => [p.rank, p.playerId!]),
    )
    const top3PlayerIds = new Set(playerIdByRank.values())

    // Tous les users avec des picks Golden Boot
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

    let usersUpdated = 0
    const results: { username: string; points: number }[] = []

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
      results.push({ username: user.username, points })
      usersUpdated++
    }

    return NextResponse.json({
      ok: true,
      usersUpdated,
      top3: top3.map((s) => `${s.rank}. ${s.name}`),
      results,
    })
  } catch (error) {
    console.error("[golden-boot]", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}