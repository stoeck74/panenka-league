"use server"

import { prisma } from "@/lib/prisma"
import { calculatePoints } from "@/lib/points"

// ============================================
// RECALCULATE POINTS
// ============================================
// Recalcule les points de tous les pronos sur les matchs FINISHED
// passés en paramètre (ou tous les matchs FINISHED si rien n'est passé).
//
// Cette fonction est appelable :
//   - depuis le cron de sync (avec les matchIds qui viennent de finir)
//   - à la main (admin) via une UI dédiée plus tard
//
// Idempotente : on peut la rejouer autant qu'on veut.

export type RecalculateResult = {
  ok: boolean
  matchesProcessed: number
  predictionsUpdated: number
  error?: string
}

/**
 * @param matchIds Optionnel : limiter le recalcul à ces matchs.
 *                 Sinon, recalcule sur tous les matchs FINISHED.
 */
export async function recalculatePoints(
  matchIds?: string[],
): Promise<RecalculateResult> {
  try {
 // 1. Récupérer les matchs concernés (FINISHED + score connu)
    // Si pas de matchIds explicites → on limite à la saison active uniquement
    // (sinon on recalculerait inutilement les saisons passées)
    let seasonFilter = {}
    if (!matchIds || matchIds.length === 0) {
      const activeSeason = await prisma.season.findFirst({
        where: { isActive: true },
        select: { id: true },
      })
      if (!activeSeason) {
        return { ok: true, matchesProcessed: 0, predictionsUpdated: 0 }
      }
      seasonFilter = { matchday: { seasonId: activeSeason.id } }
    }

    const matches = await prisma.match.findMany({
      where: {
        status: "FINISHED",
        homeScore: { not: null },
        awayScore: { not: null },
        ...(matchIds && matchIds.length > 0
          ? { id: { in: matchIds } }
          : seasonFilter),
      },
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
      },
    })

    if (matches.length === 0) {
      return { ok: true, matchesProcessed: 0, predictionsUpdated: 0 }
    }

    // 2. Récupérer tous les pronos sur ces matchs
    const predictions = await prisma.prediction.findMany({
      where: {
        matchId: { in: matches.map((m) => m.id) },
      },
      select: {
        id: true,
        matchId: true,
        homeScore: true,
        awayScore: true,
        isBanco: true,
        pointsEarned: true,
      },
    })

    // Map matchId → score réel pour lookup rapide
    const actualScoreByMatchId = new Map(
      matches.map((m) => [m.id, { homeScore: m.homeScore!, awayScore: m.awayScore! }]),
    )

    // 3. Calculer + updater (uniquement si différent — évite des writes inutiles)
    let predictionsUpdated = 0
    for (const pred of predictions) {
      const actual = actualScoreByMatchId.get(pred.matchId)
      if (!actual) continue

      const { points } = calculatePoints(
        {
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
          isBanco: pred.isBanco,
        },
        actual,
      )

      if (pred.pointsEarned !== points) {
        await prisma.prediction.update({
          where: { id: pred.id },
          data: { pointsEarned: points },
        })
        predictionsUpdated++
      }
    }

    return {
      ok: true,
      matchesProcessed: matches.length,
      predictionsUpdated,
    }
  } catch (error) {
    console.error("[recalculatePoints] failed:", error)
    return {
      ok: false,
      matchesProcessed: 0,
      predictionsUpdated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
