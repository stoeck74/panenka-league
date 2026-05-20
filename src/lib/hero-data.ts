// ============================================
// HERO DATA — Données pour la HeroProgressBar du dashboard
// ============================================
// Récupère la prochaine matchday pronostiquable (= UPCOMING) et le nombre
// de pronos déjà posés par l'utilisateur sur les matchs de cette journée.
//
// Règle métier (Cas B) : les pronos J(n+1) ne s'ouvrent qu'après la fin
// du dernier match de J(n). Donc la journée pronostiquable est la
// première matchday dont le statut DB est UPCOMING.

import { prisma } from "@/lib/prisma"

export type HeroProgress = {
  matchdayNumber: number
  matchesCount: number      // nombre total de matchs sur la matchday (typiquement 9)
  predictionsMade: number   // nombre de pronos complets de l'utilisateur sur cette matchday
}

/**
 * Override dev : permet de tester la barre hors saison.
 */
function getDevForcedMatchday(): number | null {
  if (process.env.NODE_ENV === "production") return null
  const raw = process.env.DEV_FORCE_CURRENT_MATCHDAY
  if (!raw) return null
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Retourne les données de la HeroProgressBar pour le user, ou `null` si
 * aucune matchday n'est pronostiquable (fin de saison OU journée en cours).
 *
 * NB : en mode dev avec DEV_FORCE_CURRENT_MATCHDAY, on retourne quand même
 * cette matchday pour permettre de tester l'UI.
 */
export async function getHeroProgress(
  userId: string | null | undefined,
): Promise<HeroProgress | null> {
  if (!userId) return null

  // 1. Saison active
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return null

  // 2. Trouver la matchday pronostiquable
  //    - En prod : la première UPCOMING par ordre croissant de numéro
  //    - En dev avec override : la matchday forcée (peu importe son statut DB)
  const forced = getDevForcedMatchday()

  const matchday = forced !== null
    ? await prisma.matchday.findUnique({
        where: {
          seasonId_number: { seasonId: season.id, number: forced },
        },
        select: { id: true, number: true },
      })
    : await prisma.matchday.findFirst({
        where: {
          seasonId: season.id,
          status: "UPCOMING",
        },
        orderBy: { number: "asc" },
        select: { id: true, number: true },
      })

  if (!matchday) return null

  // 3. Compter le total des matchs de cette matchday
  const matchesCount = await prisma.match.count({
    where: { matchdayId: matchday.id },
  })

  if (matchesCount === 0) return null

  // 4. Compter les pronos COMPLETS du user sur ces matchs
  //    "Complet" = il y a une row Prediction (homeScore et awayScore sont
  //    non-null par schema, donc l'existence = complet)
  const predictionsMade = await prisma.prediction.count({
    where: {
      userId,
      match: { matchdayId: matchday.id },
    },
  })

  return {
    matchdayNumber: matchday.number,
    matchesCount,
    predictionsMade,
  }
}