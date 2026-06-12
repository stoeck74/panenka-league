// ============================================
// MATCHES DATA — Récupération + mapping pour la page /matchs
// ============================================
// Lit la saison active, choisit la matchday "centrale" (en cours ou prochaine),
// récupère une fenêtre de 7 matchdays autour, lit les pronos du user connecté,
// et mappe tout au format attendu par <MatchsView />.

import { prisma } from "@/lib/prisma"
import { getLockAt, isLockedAt } from "@/lib/lock"

const WINDOW_BEFORE = 3
const WINDOW_AFTER = 3

// ============================================
// TYPES PUBLICS (attendus par MatchsView/MatchCard)
// ============================================

export type ViewMatchTeam = {
  shortName: string
  tla: string
  crest: string
}

export type ViewMatch = {
  id: string
  kickoffDate: string  // "ven. 22 nov."
  kickoffTime: string  // "21:00"
  status: "scheduled" | "live" | "finished" | "locked"
  homeTeam: ViewMatchTeam
  awayTeam: ViewMatchTeam
  homeScore?: number
  awayScore?: number
  // Mon prono
  myHomePrediction?: number | null
  myAwayPrediction?: number | null
  isBanco?: boolean
  myPoints?: number
  // On garde un lien vers le numéro de journée pour pouvoir filtrer côté client
  matchdayNumber: number
}

export type ViewMatchday = {
  number: number
  status: "past" | "current" | "future"
  // Instant de verrouillage de la journée (ISO) = 1er kickoff - 1h.
  // null si la journée n'a aucun match. Sert au verrou côté client,
  // calculé sur le calendrier (pas sur la sync API).
  lockAt: string | null
  // Snapshot serveur : la journée est-elle déjà verrouillée au moment
  // du rendu ? Valeur déterministe (pas de mismatch d'hydratation).
  isLocked: boolean
}

export type MatchsPageData = {
  matches: ViewMatch[]       // tous les matchs des 7 matchdays visibles
  matchdays: ViewMatchday[]  // les 7 matchdays (onglets)
  currentMatchday: number    // celle qu'on sélectionne par défaut
}

// ============================================
// DEV OVERRIDE (jamais en prod)
// ============================================
function getDevForcedMatchday(): number | null {
  if (process.env.NODE_ENV === "production") return null
  const raw = process.env.DEV_FORCE_CURRENT_MATCHDAY
  if (!raw) return null
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

// ============================================
// FETCH
// ============================================

/**
 * @param userId - ID de l'utilisateur connecté (passé par la page après auth())
 *   Si null/undefined, les pronos seront tous vides.
 */
export async function getMatchsPageData(
  userId: string | null | undefined,
): Promise<MatchsPageData | null> {
  // 1. Saison active
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return null

  // 2. Toutes les matchdays de la saison (pour calculer la fenêtre)
  const allMatchdays = await prisma.matchday.findMany({
    where: { seasonId: season.id },
    orderBy: { number: "asc" },
    select: { number: true, status: true },
  })
  if (allMatchdays.length === 0) return null

  // 3. Choisir la matchday centrale
  const centralNumber = pickCentralMatchday(allMatchdays)

  // 4. Fenêtre [centre-3, centre+3], clampée sur [premier, dernier]
  const firstNumber = allMatchdays[0].number
  const lastNumber = allMatchdays[allMatchdays.length - 1].number
  const windowStart = Math.max(firstNumber, centralNumber - WINDOW_BEFORE)
  const windowEnd = Math.min(lastNumber, centralNumber + WINDOW_AFTER)

  // 5. Récupérer ces matchdays et leurs matchs (1 query optimisée)
  const matchdaysInWindow = await prisma.matchday.findMany({
    where: {
      seasonId: season.id,
      number: { gte: windowStart, lte: windowEnd },
    },
    orderBy: { number: "asc" },
    include: {
      matches: {
        orderBy: { kickoffAt: "asc" },
        include: {
          homeTeam: { select: { shortName: true, tla: true, crestUrl: true } },
          awayTeam: { select: { shortName: true, tla: true, crestUrl: true } },
        },
      },
    },
  })

  // 6. Récupérer les pronos du user pour ces matchs (1 query)
  const matchIdsInWindow = matchdaysInWindow.flatMap((md) =>
    md.matches.map((m) => m.id),
  )
  const predictionsByMatchId = new Map<
    string,
    { homeScore: number; awayScore: number; isBanco: boolean; pointsEarned: number | null }
  >()
  if (userId && matchIdsInWindow.length > 0) {
    const userPredictions = await prisma.prediction.findMany({
      where: {
        userId,
        matchId: { in: matchIdsInWindow },
      },
      select: {
        matchId: true,
        homeScore: true,
        awayScore: true,
        isBanco: true,
        pointsEarned: true,
      },
    })
    for (const p of userPredictions) {
      predictionsByMatchId.set(p.matchId, {
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        isBanco: p.isBanco,
        pointsEarned: p.pointsEarned,
      })
    }
  }

  // 7. Mapping vers les types View
  const matchdays: ViewMatchday[] = matchdaysInWindow.map((md) => {
    // md.matches est trié par kickoffAt asc → [0] = premier coup d'envoi.
    // Même base de calcul que le serveur (isMatchdayOpen) → cohérence garantie.
    const firstKickoff = md.matches[0]?.kickoffAt ?? null
    const lockAt = firstKickoff ? getLockAt(firstKickoff) : null
    return {
      number: md.number,
      status: mapMatchdayStatus(md.status, md.number, centralNumber),
      lockAt: lockAt ? lockAt.toISOString() : null,
      isLocked: firstKickoff ? isLockedAt(firstKickoff) : false,
    }
  })

  const matches: ViewMatch[] = matchdaysInWindow.flatMap((md) =>
    md.matches.map((m) => {
      const userPred = predictionsByMatchId.get(m.id)
      return {
        id: m.id,
        kickoffDate: formatKickoffDate(m.kickoffAt),
        kickoffTime: formatKickoffTime(m.kickoffAt),
        status: shouldForceScheduled(md.number, centralNumber)
          ? "scheduled"
          : mapMatchStatus(m.status, m.kickoffAt),
        homeTeam: {
          shortName: m.homeTeam.shortName,
          tla: m.homeTeam.tla,
          crest: m.homeTeam.crestUrl ?? "",
        },
        awayTeam: {
          shortName: m.awayTeam.shortName,
          tla: m.awayTeam.tla,
          crest: m.awayTeam.crestUrl ?? "",
        },
        homeScore: m.homeScore ?? undefined,
        awayScore: m.awayScore ?? undefined,
        myHomePrediction: userPred?.homeScore ?? null,
        myAwayPrediction: userPred?.awayScore ?? null,
        isBanco: userPred?.isBanco ?? false,
        myPoints: userPred?.pointsEarned ?? undefined,
        matchdayNumber: md.number,
      }
    }),
  )

  return {
    matches,
    matchdays,
    currentMatchday: centralNumber,
  }
}

// ============================================
// HELPERS — Choix de la matchday centrale
// ============================================

function pickCentralMatchday(
  matchdays: { number: number; status: "UPCOMING" | "ACTIVE" | "FINISHED" }[],
): number {
  // Override dev : on force la matchday demandée si elle existe
  const forced = getDevForcedMatchday()
  if (forced !== null && matchdays.some((md) => md.number === forced)) {
    return forced
  }

  const active = matchdays.find((md) => md.status === "ACTIVE")
  if (active) return active.number

  const nextUpcoming = matchdays.find((md) => md.status === "UPCOMING")
  if (nextUpcoming) return nextUpcoming.number

  return matchdays[matchdays.length - 1].number
}

// ============================================
// HELPERS — Mapping enums DB → strings UI
// ============================================

function mapMatchdayStatus(
  dbStatus: "UPCOMING" | "ACTIVE" | "FINISHED",
  number: number,
  centralNumber: number,
): "past" | "current" | "future" {
  if (number === centralNumber) return "current"
  if (dbStatus === "FINISHED" || dbStatus === "ACTIVE") return "past"
  return "future"
}

function mapMatchStatus(
  dbStatus: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED",
  kickoffAt: Date,
): "scheduled" | "live" | "finished" | "locked" {
  if (dbStatus === "FINISHED" || dbStatus === "POSTPONED") return "finished"
  if (dbStatus === "LIVE") return "live"
  if (kickoffAt.getTime() <= Date.now()) return "locked"
  return "scheduled"
}

/**
 * En mode dev avec DEV_FORCE_CURRENT_MATCHDAY, on force tous les matchs
 * de la matchday centrale à apparaître comme "scheduled" pour permettre
 * la saisie de pronos.
 */
function shouldForceScheduled(matchdayNumber: number, centralNumber: number): boolean {
  const forced = getDevForcedMatchday()
  return forced !== null && matchdayNumber === centralNumber
}

// ============================================
// HELPERS — Formatage des dates (TZ Europe/Paris)
// ============================================

function formatKickoffDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(date)

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? ""
  const day = parts.find((p) => p.type === "day")?.value ?? ""
  const month = parts.find((p) => p.type === "month")?.value ?? ""

  return `${weekday} ${day} ${month}`.toLowerCase()
}

function formatKickoffTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}