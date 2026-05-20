// ============================================
// BARÈME PANENKA
// ============================================
// Calcul des points pour un prono Panenka selon le barème classique :
//   - Score exact       : 3 pts
//   - Bon résultat seul : 1 pt
//   - Mauvais résultat  : 0 pt
//   - Banco             : ×2 sur les points gagnés (0 reste 0)
//
// Cette fonction est pure : pas d'accès DB, pas d'effet de bord.
// Elle est utilisée à la sync (quand un match passe à FINISHED) et
// peut aussi être appelée à la main via une server action.

export const POINTS_EXACT = 3
export const POINTS_GOOD_RESULT = 1
export const POINTS_WRONG = 0

export type PointsBreakdown = {
  points: number
  reason: "exact" | "good_result" | "wrong"
  bancoMultiplier: 1 | 2
}

/**
 * Calcule les points gagnés par un prono donné, sachant le score final.
 *
 * @param prediction.homeScore - Score domicile prédit
 * @param prediction.awayScore - Score extérieur prédit
 * @param prediction.isBanco   - Le prono est-il marqué banco ?
 * @param actual.homeScore     - Score domicile réel
 * @param actual.awayScore     - Score extérieur réel
 */
export function calculatePoints(
  prediction: { homeScore: number; awayScore: number; isBanco: boolean },
  actual: { homeScore: number; awayScore: number },
): PointsBreakdown {
  const multiplier = prediction.isBanco ? 2 : 1

  // 1. Score exact ?
  if (
    prediction.homeScore === actual.homeScore &&
    prediction.awayScore === actual.awayScore
  ) {
    return {
      points: POINTS_EXACT * multiplier,
      reason: "exact",
      bancoMultiplier: multiplier,
    }
  }

  // 2. Bon résultat ? (même issue : H, N, A)
  const predOutcome = getOutcome(prediction.homeScore, prediction.awayScore)
  const actualOutcome = getOutcome(actual.homeScore, actual.awayScore)

  if (predOutcome === actualOutcome) {
    return {
      points: POINTS_GOOD_RESULT * multiplier,
      reason: "good_result",
      bancoMultiplier: multiplier,
    }
  }

  // 3. Faux
  return {
    points: POINTS_WRONG,
    reason: "wrong",
    bancoMultiplier: multiplier,
  }
}

function getOutcome(home: number, away: number): "H" | "N" | "A" {
  if (home > away) return "H"
  if (home < away) return "A"
  return "N"
}