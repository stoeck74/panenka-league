import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const season = await prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true },
    })

    // Stats globales
    const [totalUsers, totalPredictions, totalMatchesFinished, totalPlayers] =
      await Promise.all([
        prisma.user.count(),
        prisma.prediction.count(),
        prisma.match.count({ where: { status: "FINISHED" } }),
        prisma.player.count(),
      ])

    // Points pronos par user (sur la saison active)
    const pronoPointsByUserId = new Map<string, number>()
    if (season) {
      const predictions = await prisma.prediction.findMany({
        where: {
          pointsEarned: { not: null },
          match: { matchday: { seasonId: season.id } },
        },
        select: { userId: true, pointsEarned: true },
      })
      for (const p of predictions) {
        const current = pronoPointsByUserId.get(p.userId) ?? 0
        pronoPointsByUserId.set(p.userId, current + (p.pointsEarned ?? 0))
      }
    }

    // Tous les users
    const rawUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        goldenBootPoints: true,
        bonusPoints: true,
        _count: { select: { predictions: true } },
      },
      orderBy: { username: "asc" },
    })

    const users = rawUsers.map((u) => {
      const pronoPoints = pronoPointsByUserId.get(u.id) ?? 0
      return {
        id: u.id,
        username: u.username,
        predictionsCount: u._count.predictions,
        pronoPoints,
        goldenBootPoints: u.goldenBootPoints,
        bonusPoints: u.bonusPoints,
        totalPoints: pronoPoints + u.goldenBootPoints + u.bonusPoints,
      }
    })

    return NextResponse.json({
      ok: true,
      stats: { totalUsers, totalPredictions, totalMatchesFinished, totalPlayers },
      users,
    })
  } catch (error) {
    console.error("[admin/data]", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}