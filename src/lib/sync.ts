/**
 * Logique de sync Football-Data → DB.
 *
 * Ces fonctions sont pures (pas de console.log spécifique au CLI ni à HTTP).
 * Elles renvoient un résumé chiffré que l'appelant peut logger ou renvoyer
 * en JSON selon son contexte (script CLI ou route cron).
 *
 * Toutes les opérations sont idempotentes (upsert), donc rejouer une sync
 * ne crée jamais de doublons.
 */

import { prisma } from "@/lib/prisma"
import {
  fetchLigue1Competition,
  fetchLigue1Matches,
  mapMatchStatus,
  type FootballDataMatch,
} from "@/lib/football-data"
import type {
  MatchdayStatus,
  MatchStatus,
} from "@/generated/prisma/enums"

// ============================================
// TYPES DE RETOUR
// ============================================

export type SyncSeasonResult = {
  season: {
    id: string
    name: string
    externalId: number
    startDate: Date
    endDate: Date
    wasCreated: boolean
  }
}

export type SyncMatchesResult = {
  seasonExternalId: number
  matchdays: { created: number; updated: number }
  matches: { created: number; updated: number; skipped: number }
  skippedReasons: string[]
}

// ============================================
// SYNC SEASON
// ============================================

/**
 * Récupère la saison courante de Ligue 1 depuis Football-Data et l'upsert en DB.
 * Marque cette saison comme `isActive: true` et désactive les autres.
 *
 * Idempotent : safe à rejouer.
 */
export async function syncCurrentSeason(): Promise<SyncSeasonResult> {
  const competition = await fetchLigue1Competition()
  const apiSeason = competition.currentSeason

  // Le `name` n'est pas renvoyé par l'API au niveau de la saison, on le compose.
  // Format : "Ligue 1 2025/2026" — on dérive depuis les dates.
  const startYear = new Date(apiSeason.startDate).getUTCFullYear()
  const endYear = new Date(apiSeason.endDate).getUTCFullYear()
  const name = `${competition.name} ${startYear}/${endYear}`

  // Vérifier si la saison existe déjà (par externalId)
  const existing = await prisma.season.findUnique({
    where: { externalId: apiSeason.id },
  })

  const season = await prisma.$transaction(async (tx) => {
    // Désactiver toutes les autres saisons
    await tx.season.updateMany({
      where: { externalId: { not: apiSeason.id } },
      data: { isActive: false },
    })

    // Upsert la saison courante (active)
    return tx.season.upsert({
      where: { externalId: apiSeason.id },
      create: {
        externalId: apiSeason.id,
        name,
        startDate: new Date(apiSeason.startDate),
        endDate: new Date(apiSeason.endDate),
        isActive: true,
      },
      update: {
        name,
        startDate: new Date(apiSeason.startDate),
        endDate: new Date(apiSeason.endDate),
        isActive: true,
      },
    })
  })

  return {
    season: {
      id: season.id,
      name: season.name,
      externalId: season.externalId!,
      startDate: season.startDate,
      endDate: season.endDate,
      wasCreated: !existing,
    },
  }
}

// ============================================
// SYNC MATCHES
// ============================================

/**
 * Récupère tous les matchs de la saison courante et les upsert en DB.
 * Crée à la volée les Matchdays manquants en calculant leurs dates depuis
 * les matchs (premier kickoff = startDate, dernier kickoff = endDate).
 *
 * Skip avec raison si :
 *   - une équipe n'est pas dans notre table Team (sync-teams pas joué ?)
 *   - aucune saison active en DB (syncCurrentSeason pas joué ?)
 *
 * Idempotent : safe à rejouer.
 */
export async function syncMatches(): Promise<SyncMatchesResult> {
  // 1. Récupérer la saison active
  const activeSeason = await prisma.season.findFirst({
    where: { isActive: true },
  })
  if (!activeSeason) {
    throw new Error(
      "Aucune saison active en DB. Lance syncCurrentSeason() d'abord.",
    )
  }
  if (!activeSeason.externalId) {
    throw new Error(
      `La saison active "${activeSeason.name}" n'a pas d'externalId.`,
    )
  }

  // 2. Récupérer tous les matchs depuis l'API
  const { matches: apiMatches } = await fetchLigue1Matches()

  // 3. Construire une lookup table externalId Football-Data → notre Team.id
  const allTeams = await prisma.team.findMany({
    select: { id: true, externalId: true },
  })
  const teamIdByExternalId = new Map(
    allTeams.map((t) => [t.externalId, t.id]),
  )

  // 4. Grouper les matchs par numéro de journée pour calculer les dates
  const matchesByMatchday = new Map<number, FootballDataMatch[]>()
  for (const m of apiMatches) {
    const list = matchesByMatchday.get(m.matchday) ?? []
    list.push(m)
    matchesByMatchday.set(m.matchday, list)
  }

  const result: SyncMatchesResult = {
    seasonExternalId: activeSeason.externalId,
    matchdays: { created: 0, updated: 0 },
    matches: { created: 0, updated: 0, skipped: 0 },
    skippedReasons: [],
  }

  const now = new Date()

  // 5. Pour chaque journée, upsert le Matchday puis ses matchs
  for (const [matchdayNumber, matchdayMatches] of matchesByMatchday) {
    // Trier les matchs de la journée par kickoff pour récupérer
    // startDate (premier match) et endDate (dernier match)
    const sorted = [...matchdayMatches].sort(
      (a, b) =>
        new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
    )
    const startDate = new Date(sorted[0].utcDate)
    const endDate = new Date(sorted[sorted.length - 1].utcDate)

    // Déduire le statut de la matchday depuis l'état des matchs
    const matchdayStatus = deriveMatchdayStatus(
      sorted.map((m) => ({
        status: mapMatchStatus(m.status),
        kickoffAt: new Date(m.utcDate),
      })),
      now,
    )

    // Upsert Matchday (clé naturelle = seasonId + number)
    const existingMatchday = await prisma.matchday.findUnique({
      where: {
        seasonId_number: {
          seasonId: activeSeason.id,
          number: matchdayNumber,
        },
      },
    })

    const matchday = await prisma.matchday.upsert({
      where: {
        seasonId_number: {
          seasonId: activeSeason.id,
          number: matchdayNumber,
        },
      },
      create: {
        seasonId: activeSeason.id,
        number: matchdayNumber,
        status: matchdayStatus,
        startDate,
        endDate,
      },
      update: {
        status: matchdayStatus,
        startDate,
        endDate,
      },
    })

    if (existingMatchday) {
      result.matchdays.updated++
    } else {
      result.matchdays.created++
    }

    // Upsert chaque match de la journée
    for (const m of matchdayMatches) {
      const homeTeamId = teamIdByExternalId.get(m.homeTeam.id)
      const awayTeamId = teamIdByExternalId.get(m.awayTeam.id)

      if (!homeTeamId || !awayTeamId) {
        result.matches.skipped++
        result.skippedReasons.push(
          `Match ${m.id} (J${m.matchday}, ${m.homeTeam.tla} vs ${m.awayTeam.tla}) : équipe manquante en DB (${!homeTeamId ? m.homeTeam.tla : m.awayTeam.tla})`,
        )
        continue
      }

      const existingMatch = await prisma.match.findUnique({
        where: { externalId: m.id },
      })

      await prisma.match.upsert({
        where: { externalId: m.id },
        create: {
          externalId: m.id,
          matchdayId: matchday.id,
          homeTeamId,
          awayTeamId,
          kickoffAt: new Date(m.utcDate),
          status: mapMatchStatus(m.status),
          homeScore: m.score.fullTime.home,
          awayScore: m.score.fullTime.away,
        },
        update: {
          matchdayId: matchday.id,
          homeTeamId,
          awayTeamId,
          kickoffAt: new Date(m.utcDate),
          status: mapMatchStatus(m.status),
          homeScore: m.score.fullTime.home,
          awayScore: m.score.fullTime.away,
        },
      })

      if (existingMatch) {
        result.matches.updated++
      } else {
        result.matches.created++
      }
    }
  }

  return result
}

// ============================================
// HELPERS INTERNES
// ============================================

/**
 * Déduit le statut UI d'une matchday depuis l'état de ses matchs.
 *
 *   ACTIVE   = la journée est en cours (le 1er match a commencé OU est à T-1h)
 *              c'est aussi le seuil où on lock les pronos
 *   FINISHED = tous les matchs sont FINISHED ou POSTPONED
 *   UPCOMING = sinon (matchs à venir, plus d'1h avant le 1er kickoff)
 *
 * NB : "ACTIVE" ici signifie "en cours de jeu / locked", pas "ouverte aux pronos".
 * Pour savoir si on peut pronostiquer, on regarde si la matchday est UPCOMING
 * ET que `now < kickoffAt - 1h` du premier match.
 */
function deriveMatchdayStatus(
  matches: { status: MatchStatus; kickoffAt: Date }[],
  now: Date,
): MatchdayStatus {
  if (matches.length === 0) return "UPCOMING"

  const sorted = [...matches].sort(
    (a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime(),
  )
  const firstKickoff = sorted[0].kickoffAt
  const oneHourBeforeFirstKickoff = new Date(
    firstKickoff.getTime() - 60 * 60 * 1000,
  )

  // Tous terminés ou reportés ? → FINISHED
  const allDone = matches.every(
    (m) => m.status === "FINISHED" || m.status === "POSTPONED",
  )
  if (allDone) return "FINISHED"

  // Premier match à moins d'1h ou déjà commencé ? → ACTIVE
  if (now >= oneHourBeforeFirstKickoff) return "ACTIVE"

  return "UPCOMING"
}