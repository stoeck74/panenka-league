"use server"

import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"

// ============================================
// CALCUL DES POINTS POUR UN PRONO
// ============================================

type CalculatePointsArgs = {
  predHome: number
  predAway: number
  predQualifierTeamId: string | null
  matchHome: number
  matchAway: number
  matchHomeTeamId: string | null
  matchAwayTeamId: string | null
  matchStage: string
  matchHomePenalties: number | null
  matchAwayPenalties: number | null
}

function calculatePoints(args: CalculatePointsArgs): number {
  const {
    predHome,
    predAway,
    predQualifierTeamId,
    matchHome,
    matchAway,
    matchHomeTeamId,
    matchAwayTeamId,
    matchStage,
    matchHomePenalties,
    matchAwayPenalties,
  } = args

  const isKO = matchStage !== "GROUP"
  const isDrawPrediction = predHome === predAway
  const isDrawRealResult = matchHome === matchAway

  // ============================================
  // DÉTERMINER LE VRAI VAINQUEUR
  // ============================================
  // En poules : null si nul, sinon l'équipe avec le plus de buts
  // En KO :
  //   - Si pas de TAB et pas nul : le meilleur après prolong
  //   - Si TAB : celui qui a marqué le plus de TAB
  let realWinnerTeamId: string | null = null
  if (matchHome > matchAway) {
    realWinnerTeamId = matchHomeTeamId
  } else if (matchAway > matchHome) {
    realWinnerTeamId = matchAwayTeamId
  } else if (isKO && matchHomePenalties !== null && matchAwayPenalties !== null) {
    // Score nul à la fin du temps réglementaire + prolongation, départage aux TAB
    if (matchHomePenalties > matchAwayPenalties) {
      realWinnerTeamId = matchHomeTeamId
    } else if (matchAwayPenalties > matchHomePenalties) {
      realWinnerTeamId = matchAwayTeamId
    }
  }
  // En poules avec nul, realWinnerTeamId reste null

  // ============================================
  // DÉTERMINER LE VAINQUEUR PRÉDIT
  // ============================================
  let predictedWinnerTeamId: string | null = null
  if (predHome > predAway) {
    predictedWinnerTeamId = matchHomeTeamId
  } else if (predAway > predHome) {
    predictedWinnerTeamId = matchAwayTeamId
  } else if (isKO && predQualifierTeamId) {
    // Prono nul en KO avec étoile = on prend l'équipe qualifiée
    predictedWinnerTeamId = predQualifierTeamId
  }
  // Sinon : prono nul sans étoile (KO) ou prono nul en poules → reste null

  // ============================================
  // CALCUL DES POINTS
  // ============================================
  const isExactScore = predHome === matchHome && predAway === matchAway

  // SCORE EXACT + bon vainqueur → +3
  if (isExactScore) {
    // En poules, nul exact = +3 (pas de vainqueur à vérifier)
    if (!isKO && isDrawPrediction && isDrawRealResult) {
      return 3
    }
    // Match avec vainqueur : il faut que le prono ait le bon vainqueur
    if (predictedWinnerTeamId === realWinnerTeamId) {
      return 3
    }
    // Score exact mais mauvais vainqueur (cas KO 1-1 avec étoile sur le perdant des TAB) → 0
    return 0
  }

  // BON VAINQUEUR (sans score exact) → +1
  if (predictedWinnerTeamId !== null && predictedWinnerTeamId === realWinnerTeamId) {
    return 1
  }

  // En poules, prono nul + résultat nul (sans score exact) → +1
  if (!isKO && isDrawPrediction && isDrawRealResult) {
    return 1
  }

  return 0
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Recalcule les points de tous les pronos pour un match donné.
 * À appeler après que le match soit marqué FINISHED.
 */
export async function calculatePointsForMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      predictions: true,
    },
  })

  if (!match) {
    return { ok: false, error: "Match introuvable" }
  }
  if (match.status !== "FINISHED") {
    return { ok: false, error: "Match pas encore terminé" }
  }
  if (match.homeScore === null || match.awayScore === null) {
    return { ok: false, error: "Scores manquants" }
  }

  let updatedCount = 0
  for (const pred of match.predictions) {
    const points = calculatePoints({
      predHome: pred.homeScore,
      predAway: pred.awayScore,
      predQualifierTeamId: pred.qualifierTeamId,
      matchHome: match.homeScore,
      matchAway: match.awayScore,
      matchHomeTeamId: match.homeTeamId,
      matchAwayTeamId: match.awayTeamId,
      matchStage: match.stage,
      matchHomePenalties: match.homePenalties,
      matchAwayPenalties: match.awayPenalties,
    })

    await prisma.prediction.update({
      where: { id: pred.id },
      data: { pointsEarned: points },
    })
    updatedCount++
  }

  return { ok: true, updatedCount }
}

/**
 * Recalcule TOUS les pronos de TOUS les matchs FINISHED.
 * À utiliser pour un resync complet (par exemple après changement de règle).
 */
/**
 * Recalcule TOUS les points de TOUS les matchs FINISHED.
 * Version INTERNE (sans auth) — utilisée par la route sync.
 */
export async function calculateAllPointsInternal() {
  const finishedMatches = await prisma.match.findMany({
    where: {
      status: "FINISHED",
      homeScore: { not: null },
      awayScore: { not: null },
    },
    select: { id: true },
  })

  let totalUpdated = 0
  for (const match of finishedMatches) {
    const result = await calculatePointsForMatch(match.id)
    if (result.ok && result.updatedCount) {
      totalUpdated += result.updatedCount
    }
  }

  return { ok: true, matchesProcessed: finishedMatches.length, totalUpdated }
}

/**
 * Version PUBLIQUE (avec check admin) — utilisée depuis l'admin UI.
 */
export async function calculateAllPoints() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Accès admin requis" }
  }
  return calculateAllPointsInternal()
}