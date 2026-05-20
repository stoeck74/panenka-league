// ============================================
// DASHBOARD DATA — Panenka (refacto 4 états)
// ============================================
// Modélisation : à tout instant, l'app est dans l'un de ces 4 états :
//   "pre"           — pré-saison : pas encore de matchday à pronostiquer
//   "pronosticable" — une matchday est ouverte aux pronos
//   "ongoing"       — une matchday est en cours / lockée
//   "post"          — saison terminée (toutes les matchdays sont FINISHED)
//
// Le lock se calcule en LIVE côté code en comparant `kickoffAt` à `now`,
// PAS via le statut DB (le cron peut être en retard).

import { prisma } from "@/lib/prisma"
import { calculatePoints } from "@/lib/points"

// ============================================
// CONSTANTES + TYPES
// ============================================

const LOCK_DELAY_MS = 60 * 60 * 1000 // 1h avant le 1er match
const PRESEASON_CUTOFF_MONTH = 7      // 0-indexed : août
const PRESEASON_CUTOFF_DAY = 1

const DEV_FORCED_MATCHDAY_KEY = "DEV_FORCE_CURRENT_MATCHDAY"

export type SeasonPhase = "pre" | "pronosticable" | "ongoing" | "post"

export type CurrentStage = {
  phase: SeasonPhase
  /** Numéro de matchday concernée par l'état (null pour pre/post) */
  number: number | null
  /** Label affiché dans le hero */
  label: string
  /** Date du premier match de la matchday, formatée FR */
  startDate: string | null
  /** Heure du premier match (HH:mm), TZ Europe/Paris */
  startTime: string | null
  /** Pronos faits par le user sur cette matchday */
  predictionsMade: number
  /** Total des matchs de la matchday */
  matchesCount: number
}

export type UserStats = {
  totalPoints: number
  exactScores: number
  goodResults: number
  wrong: number
  finishedPredictions: number
  successRate: number
}

export type UserPosition = {
  position: number
  totalPlayers: number
}

export type DashboardMatch = {
  id: string
  kickoffDate: string
  kickoffTime: string
  homeTeamTla: string
  homeTeamName: string
  awayTeamTla: string
  awayTeamName: string
  myHomePrediction: number | null
  myAwayPrediction: number | null
}

export type LeaderboardEntry = {
  position: number
  username: string
  avatarStyle: string | null
  avatarSeed: string | null
  points: number
  isMe: boolean
}

export type LastResult = {
  matchId: string
  isPostponed: boolean
  homeTeamTla: string
  homeTeamName: string
  awayTeamTla: string
  awayTeamName: string
  homeScore: number | null
  awayScore: number | null
  myHomePrediction: number
  myAwayPrediction: number
  isBanco: boolean
  myPoints: number
}

export type LastResultsData = {
  matchdayNumber: number | null
  results: LastResult[]
}

export type ChartDataPoint = {
  index: number
  label: string
  points: number
  cumulative: number
  position: number
}

// ============================================
// HELPERS TEMPS / DATES
// ============================================

function getDevForcedMatchday(): number | null {
  if (process.env.NODE_ENV === "production") return null
  const raw = process.env[DEV_FORCED_MATCHDAY_KEY]
  if (!raw) return null
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

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

// ============================================
// HELPERS MATCHDAY — Les 3 helpers atomiques
// ============================================

/**
 * Matchday "pronosticable" : matchday non encore commencée (1er match dans
 * plus d'1h dans le futur).
 *
 * En mode dev avec DEV_FORCE_CURRENT_MATCHDAY, on retourne cette matchday
 * peu importe son statut (pour pouvoir tester l'UI hors-saison).
 */
async function getPronosticableMatchdayRow(seasonId: string) {
  const forced = getDevForcedMatchday()
  if (forced !== null) {
    return prisma.matchday.findUnique({
      where: { seasonId_number: { seasonId, number: forced } },
      select: { id: true, number: true },
    })
  }

  // On cherche la première matchday non-FINISHED dont le 1er match
  // est dans plus d'1h.
  // → on récupère les candidates puis on filtre en JS (Prisma ne sait pas
  //   faire un join + filter sur l'agrégat min(kickoffAt) en une requête).
  const candidates = await prisma.matchday.findMany({
    where: {
      seasonId,
      status: { in: ["UPCOMING", "ACTIVE"] },
    },
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      matches: {
        orderBy: { kickoffAt: "asc" },
        take: 1,
        select: { kickoffAt: true },
      },
    },
  })

  const now = Date.now()
  for (const md of candidates) {
    const firstKickoff = md.matches[0]?.kickoffAt.getTime()
    if (firstKickoff !== undefined && firstKickoff - now > LOCK_DELAY_MS) {
      return { id: md.id, number: md.number }
    }
  }
  return null
}

/**
 * Matchday en cours / lockée : 1er match ≤ now+1h et dernier match non FINISHED.
 */
async function getOngoingMatchdayRow(seasonId: string) {
  // Même approche : récupérer les candidates et filtrer en JS
  const candidates = await prisma.matchday.findMany({
    where: {
      seasonId,
      status: { in: ["UPCOMING", "ACTIVE"] },
    },
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      matches: {
        select: { kickoffAt: true, status: true },
        orderBy: { kickoffAt: "asc" },
      },
    },
  })

  const now = Date.now()
  for (const md of candidates) {
    if (md.matches.length === 0) continue
    const firstKickoff = md.matches[0].kickoffAt.getTime()
    const allFinished = md.matches.every((m) => m.status === "FINISHED")

    // Lockée si : 1er match dans moins d'1h dans le futur OU déjà commencé,
    // ET pas tous les matchs FINISHED
    if (firstKickoff - now <= LOCK_DELAY_MS && !allFinished) {
      return { id: md.id, number: md.number }
    }
  }
  return null
}

/**
 * La dernière matchday FINISHED.
 */
async function getLastFinishedMatchdayRow(seasonId: string) {
  return prisma.matchday.findFirst({
    where: { seasonId, status: "FINISHED" },
    orderBy: { number: "desc" },
    select: { id: true, number: true },
  })
}

// ============================================
// 1. CURRENT STAGE — Détecte la phase et renvoie les infos hero
// ============================================

export async function getCurrentStage(userId: string): Promise<CurrentStage> {
  const empty: CurrentStage = {
    phase: "post",
    number: null,
    label: "Saison terminée",
    startDate: null,
    startTime: null,
    predictionsMade: 0,
    matchesCount: 0,
  }

  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return empty

  // 1. Y a-t-il une matchday lockée en ce moment ?
  const ongoing = await getOngoingMatchdayRow(season.id)
  if (ongoing) {
    return buildStage("ongoing", ongoing, userId, "Match en cours")
  }

  // 2. Y a-t-il une matchday pronostiquable ?
  const pronosticable = await getPronosticableMatchdayRow(season.id)
  if (pronosticable) {
    // Pré-saison vs Pronos ouverts : on regarde si J1 est la pronosticable
    // ET qu'aucune matchday FINISHED n'existe encore
    const anyFinished = await prisma.matchday.count({
      where: { seasonId: season.id, status: "FINISHED" },
    })
    const phase: SeasonPhase = anyFinished === 0 && pronosticable.number === 1
      ? "pre"
      : "pronosticable"
    return buildStage(phase, pronosticable, userId, phase === "pre" ? "Saison à venir" : "Prochaine journée")
  }

  // 3. Sinon, post-saison
  return empty

  // ============================================
  // (helper interne)
  // ============================================
  async function buildStage(
    phase: SeasonPhase,
    matchday: { id: string; number: number },
    userId: string,
    eyebrow: string,
  ): Promise<CurrentStage> {
    const firstMatch = await prisma.match.findFirst({
      where: { matchdayId: matchday.id },
      orderBy: { kickoffAt: "asc" },
      select: { kickoffAt: true },
    })

    const matchesCount = await prisma.match.count({
      where: { matchdayId: matchday.id },
    })
    const predictionsMade = await prisma.prediction.count({
      where: { userId, match: { matchdayId: matchday.id } },
    })

    return {
      phase,
      number: matchday.number,
      label: `Journée ${matchday.number}`,
      // eyebrow is passed but not stored here, used by caller via phase
      startDate: firstMatch ? formatKickoffDate(firstMatch.kickoffAt) : null,
      startTime: firstMatch ? formatKickoffTime(firstMatch.kickoffAt) : null,
      predictionsMade,
      matchesCount,
    }
  }
}

// ============================================
// 2. USER STATS
// ============================================

export async function getUserStats(userId: string): Promise<UserStats> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) {
    return {
      totalPoints: 0,
      exactScores: 0,
      goodResults: 0,
      wrong: 0,
      finishedPredictions: 0,
      successRate: 0,
    }
  }

  const predictions = await prisma.prediction.findMany({
    where: {
      userId,
      match: {
        status: "FINISHED",
        homeScore: { not: null },
        awayScore: { not: null },
        matchday: { seasonId: season.id },
      },
    },
    select: {
      homeScore: true,
      awayScore: true,
      isBanco: true,
      pointsEarned: true,
      match: {
        select: { homeScore: true, awayScore: true },
      },
    },
  })

  let totalPoints = 0
  let exactScores = 0
  let goodResults = 0
  let wrong = 0

  for (const p of predictions) {
    if (p.match.homeScore === null || p.match.awayScore === null) continue

    const breakdown = calculatePoints(
      { homeScore: p.homeScore, awayScore: p.awayScore, isBanco: p.isBanco },
      { homeScore: p.match.homeScore, awayScore: p.match.awayScore },
    )
    totalPoints += p.pointsEarned ?? breakdown.points

    if (breakdown.reason === "exact") exactScores++
    else if (breakdown.reason === "good_result") goodResults++
    else wrong++
  }

  const finishedPredictions = predictions.length
  const successRate =
    finishedPredictions > 0
      ? Math.round(((exactScores + goodResults) / finishedPredictions) * 100)
      : 0

  return {
    totalPoints,
    exactScores,
    goodResults,
    wrong,
    finishedPredictions,
    successRate,
  }
}

// ============================================
// 3. USER POSITION
// ============================================

export async function getUserPosition(userId: string): Promise<UserPosition> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return { position: 1, totalPlayers: 0 }

  const users = await prisma.user.findMany({ select: { id: true } })
  const totalPlayers = users.length

  const predictions = await prisma.prediction.findMany({
    where: {
      pointsEarned: { not: null },
      match: { matchday: { seasonId: season.id } },
    },
    select: { userId: true, pointsEarned: true },
  })

  const pointsByUser = new Map<string, number>()
  for (const p of predictions) {
    pointsByUser.set(
      p.userId,
      (pointsByUser.get(p.userId) ?? 0) + (p.pointsEarned ?? 0),
    )
  }

  const sorted = users
    .map((u) => ({ userId: u.id, points: pointsByUser.get(u.id) ?? 0 }))
    .sort((a, b) => b.points - a.points)

  let position = sorted.length
  let lastPoints = -1
  let lastRank = 0
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]
    const rank = entry.points !== lastPoints ? i + 1 : lastRank
    lastPoints = entry.points
    lastRank = rank
    if (entry.userId === userId) {
      position = rank
      break
    }
  }

  return { position, totalPlayers }
}

// ============================================
// 4. UPCOMING MATCHES (sur la matchday pronosticable)
// ============================================

export async function getUpcomingMatches(
  limit: number,
  userId: string,
): Promise<DashboardMatch[]> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return []

  // On utilise STRICTEMENT le pronosticable, pas l'ongoing
  const matchday = await getPronosticableMatchdayRow(season.id)
  if (!matchday) return []

  const matches = await prisma.match.findMany({
    where: { matchdayId: matchday.id },
    orderBy: { kickoffAt: "asc" },
    take: limit,
    select: {
      id: true,
      kickoffAt: true,
      homeTeam: { select: { tla: true , shortName: true } },
      awayTeam: { select: { tla: true , shortName: true } },
    },
  })

  const matchIds = matches.map((m) => m.id)
  const predictions = await prisma.prediction.findMany({
    where: { userId, matchId: { in: matchIds } },
    select: { matchId: true, homeScore: true, awayScore: true },
  })
  const predByMatchId = new Map(predictions.map((p) => [p.matchId, p]))

  return matches.map((m) => {
    const pred = predByMatchId.get(m.id)
    return {
      id: m.id,
      kickoffDate: formatKickoffDate(m.kickoffAt),
      kickoffTime: formatKickoffTime(m.kickoffAt),
      homeTeamTla: m.homeTeam.tla,
      homeTeamName: m.homeTeam.shortName,
      awayTeamTla: m.awayTeam.tla,
      awayTeamName: m.awayTeam.shortName,
      myHomePrediction: pred?.homeScore ?? null,
      myAwayPrediction: pred?.awayScore ?? null,
    }
  })
}

// ============================================
// 5. LEADERBOARD TOP N
// ============================================

export async function getLeaderboardTop(
  userId: string,
  limit: number,
): Promise<LeaderboardEntry[]> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return []

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      avatarStyle: true,
      avatarSeed: true,
    },
  })

  const predictions = await prisma.prediction.findMany({
    where: {
      pointsEarned: { not: null },
      match: { matchday: { seasonId: season.id } },
    },
    select: { userId: true, pointsEarned: true },
  })

  const pointsByUser = new Map<string, number>()
  for (const p of predictions) {
    pointsByUser.set(
      p.userId,
      (pointsByUser.get(p.userId) ?? 0) + (p.pointsEarned ?? 0),
    )
  }

  const sorted = users
    .map((u) => ({
      userId: u.id,
      username: u.username,
      avatarStyle: u.avatarStyle,
      avatarSeed: u.avatarSeed,
      points: pointsByUser.get(u.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return a.username.localeCompare(b.username)
    })

  let lastPoints = -1
  let lastRank = 0
  return sorted.slice(0, limit).map((entry, index) => {
    let rank: number
    if (entry.points !== lastPoints) {
      rank = index + 1
      lastRank = rank
      lastPoints = entry.points
    } else {
      rank = lastRank
    }
    return {
      position: rank,
      username: entry.username,
      avatarStyle: entry.avatarStyle,
      avatarSeed: entry.avatarSeed,
      points: entry.points,
      isMe: entry.userId === userId,
    }
  })
}

// ============================================
// 6. RÉSULTATS DE LA DERNIÈRE MATCHDAY FINISHED
// ============================================

export async function getLastFinishedMatchdayResults(
  userId: string,
): Promise<LastResultsData> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return { matchdayNumber: null, results: [] }

  const lastFinished = await getLastFinishedMatchdayRow(season.id)
  if (!lastFinished) return { matchdayNumber: null, results: [] }

  const matches = await prisma.match.findMany({
    where: {
      matchdayId: lastFinished.id,
      status: { in: ["FINISHED", "POSTPONED"] },
    },
    orderBy: { kickoffAt: "asc" },
    select: {
      id: true,
      status: true,
      kickoffAt: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { tla: true, shortName: true } },
      awayTeam: { select: { tla: true, shortName: true } },
      predictions: {
        where: { userId },
        select: {
          homeScore: true,
          awayScore: true,
          isBanco: true,
          pointsEarned: true,
        },
      },
    },
  })

  return {
    matchdayNumber: lastFinished.number,
    results: matches.map((m) => {
      const pred = m.predictions[0]
      const isPostponed = m.status === "POSTPONED"
      return {
        matchId: m.id,
        isPostponed,
        homeTeamTla: m.homeTeam.tla,
        homeTeamName: m.homeTeam.shortName,
        awayTeamTla: m.awayTeam.tla,
        awayTeamName: m.awayTeam.shortName,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        myHomePrediction: pred?.homeScore ?? -1,
        myAwayPrediction: pred?.awayScore ?? -1,
        isBanco: pred?.isBanco ?? false,
        myPoints: pred?.pointsEarned ?? 0,
      }
    }),
  }
}

// ============================================
// 7. POINTS LAST STAGE
// ============================================

export async function getPointsLastStage(userId: string): Promise<number> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return 0

  const lastFinishedMatchday = await prisma.matchday.findFirst({
    where: { seasonId: season.id, status: "FINISHED" },
    orderBy: { number: "desc" },
    select: { id: true },
  })
  if (!lastFinishedMatchday) return 0

  const aggregate = await prisma.prediction.aggregate({
    where: {
      userId,
      pointsEarned: { not: null },
      match: { matchdayId: lastFinishedMatchday.id },
    },
    _sum: { pointsEarned: true },
  })

  return aggregate._sum.pointsEarned ?? 0
}

// ============================================
// 8. CHART DATA
// ============================================

export async function getChartData(userId: string): Promise<ChartDataPoint[]> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return []

  const finishedMatchdays = await prisma.matchday.findMany({
    where: { seasonId: season.id, status: "FINISHED" },
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  })
  if (finishedMatchdays.length === 0) return []

  const allScored = await prisma.prediction.findMany({
    where: {
      pointsEarned: { not: null },
      match: { matchday: { seasonId: season.id } },
    },
    select: {
      userId: true,
      pointsEarned: true,
      match: { select: { matchdayId: true } },
    },
  })

  const byMatchday = new Map<string, Map<string, number>>()
  for (const p of allScored) {
    const mdId = p.match.matchdayId
    if (!byMatchday.has(mdId)) byMatchday.set(mdId, new Map())
    const userMap = byMatchday.get(mdId)!
    userMap.set(p.userId, (userMap.get(p.userId) ?? 0) + (p.pointsEarned ?? 0))
  }

  const cumulativeByUser = new Map<string, number>()
  const result: ChartDataPoint[] = []

  for (let i = 0; i < finishedMatchdays.length; i++) {
    const md = finishedMatchdays[i]
    const usersThisMd = byMatchday.get(md.id) ?? new Map<string, number>()

    for (const [uid, pts] of usersThisMd) {
      cumulativeByUser.set(uid, (cumulativeByUser.get(uid) ?? 0) + pts)
    }

    const userPointsThisMd = usersThisMd.get(userId) ?? 0
    const userCumulative = cumulativeByUser.get(userId) ?? 0

    const sorted = Array.from(cumulativeByUser.entries()).sort(
      (a, b) => b[1] - a[1],
    )
    let position = sorted.length
    let lastPoints = -1
    let lastRank = 0
    for (let j = 0; j < sorted.length; j++) {
      const [uid, pts] = sorted[j]
      const rank = pts !== lastPoints ? j + 1 : lastRank
      lastPoints = pts
      lastRank = rank
      if (uid === userId) {
        position = rank
        break
      }
    }

    result.push({
      index: i + 1,
      label: `J${md.number}`,
      points: userPointsThisMd,
      cumulative: userCumulative,
      position,
    })
  }

  return result
}

// ============================================
// 9. TOP TEAM — L'équipe qui a rapporté le plus de points au user
// ============================================
// À AJOUTER DANS src/lib/dashboard-data.ts
// Tu peux le coller n'importe où dans le fichier, après les autres exports.

export type TopTeamForUser = {
  teamId: string
  name: string
  shortName: string
  tla: string
  crestUrl: string | null
  totalPoints: number
  matchesCount: number
}

/**
 * Retourne l'équipe qui a rapporté le plus de points au user sur la saison active.
 *
 * Règle : chaque match où le user a marqué des points crédite ces points
 *         à CHACUNE des 2 équipes du match. Du coup une équipe qui joue
 *         beaucoup et où le user pronostique bien sort en tête.
 *
 * Si aucun point gagné → renvoie null.
 */
export async function getTopTeamForUser(
  userId: string,
): Promise<TopTeamForUser | null> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return null

  // Récupère tous les pronos du user qui ont rapporté des points
  // (pointsEarned non null + > 0), avec les équipes du match
  const scored = await prisma.prediction.findMany({
    where: {
      userId,
      pointsEarned: { gt: 0 },
      match: { matchday: { seasonId: season.id } },
    },
    select: {
      pointsEarned: true,
      match: {
        select: {
          homeTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              tla: true,
              crestUrl: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              tla: true,
              crestUrl: true,
            },
          },
        },
      },
    },
  })

  // Si aucun point gagné → on retourne le club préféré du user avec 0 pts
  // (valeur par défaut pour ne pas afficher un état vide)
  if (scored.length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        favoriteTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            tla: true,
            crestUrl: true,
          },
        },
      },
    })

    if (!user?.favoriteTeam) return null

    return {
      teamId: user.favoriteTeam.id,
      name: user.favoriteTeam.name,
      shortName: user.favoriteTeam.shortName,
      tla: user.favoriteTeam.tla,
      crestUrl: user.favoriteTeam.crestUrl,
      totalPoints: 0,
      matchesCount: 0,
    }
  }

  // Agrégation par teamId
  type Agg = {
    teamId: string
    name: string
    shortName: string
    tla: string
    crestUrl: string | null
    totalPoints: number
    matchesCount: number
  }
  const byTeam = new Map<string, Agg>()

  const addPoints = (
    team: {
      id: string
      name: string
      shortName: string
      tla: string
      crestUrl: string | null
    },
    points: number,
  ) => {
    const existing = byTeam.get(team.id)
    if (existing) {
      existing.totalPoints += points
      existing.matchesCount += 1
    } else {
      byTeam.set(team.id, {
        teamId: team.id,
        name: team.name,
        shortName: team.shortName,
        tla: team.tla,
        crestUrl: team.crestUrl,
        totalPoints: points,
        matchesCount: 1,
      })
    }
  }

  for (const p of scored) {
    const pts = p.pointsEarned ?? 0
    addPoints(p.match.homeTeam, pts)
    addPoints(p.match.awayTeam, pts)
  }

  // Tri par points DESC, départage par nb de matchs DESC, puis nom ASC
  const sorted = Array.from(byTeam.values()).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.matchesCount !== a.matchesCount) return b.matchesCount - a.matchesCount
    return a.name.localeCompare(b.name)
  })

  return sorted[0]
}

// ============================================
// 10. WORST TEAM — La bête noire du user
// ============================================
// À AJOUTER DANS src/lib/dashboard-data.ts
// (à coller après getTopTeamForUser)

export type WorstTeamForUser = {
  teamId: string
  name: string
  shortName: string
  tla: string
  crestUrl: string | null
  missedCount: number  // nombre de pronos à 0 pt sur cette équipe
  totalMatches: number // nombre total de matchs pronostiqués avec cette équipe
}

const WORST_TEAM_MIN_MISSED = 3

/**
 * Retourne le club avec le plus de pronos ratés (0 pt) du user sur la saison.
 *
 * Règle :
 *   - On comptabilise UNIQUEMENT les pronos sur des matchs FINISHED
 *   - Pour chaque prono avec pointsEarned === 0, on crédite home + away
 *   - Seuil : au moins WORST_TEAM_MIN_MISSED ratés pour qu'un club soit éligible
 *   - Tri : missedCount DESC, départage par totalMatches DESC (sur plus de
 *     matchs, plus parlant), puis nom ASC
 *
 * Retourne null si aucun club n'atteint le seuil.
 */
export async function getWorstTeamForUser(
  userId: string,
): Promise<WorstTeamForUser | null> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return null

  // Tous les pronos jugés du user (FINISHED, pointsEarned non-null)
  const judged = await prisma.prediction.findMany({
    where: {
      userId,
      pointsEarned: { not: null },
      match: {
        status: "FINISHED",
        matchday: { seasonId: season.id },
      },
    },
    select: {
      pointsEarned: true,
      match: {
        select: {
          homeTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              tla: true,
              crestUrl: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              tla: true,
              crestUrl: true,
            },
          },
        },
      },
    },
  })

  if (judged.length === 0) return null

  type Agg = {
    teamId: string
    name: string
    shortName: string
    tla: string
    crestUrl: string | null
    missedCount: number
    totalMatches: number
  }
  const byTeam = new Map<string, Agg>()

  const addStat = (
    team: {
      id: string
      name: string
      shortName: string
      tla: string
      crestUrl: string | null
    },
    missed: boolean,
  ) => {
    const existing = byTeam.get(team.id)
    if (existing) {
      existing.totalMatches += 1
      if (missed) existing.missedCount += 1
    } else {
      byTeam.set(team.id, {
        teamId: team.id,
        name: team.name,
        shortName: team.shortName,
        tla: team.tla,
        crestUrl: team.crestUrl,
        missedCount: missed ? 1 : 0,
        totalMatches: 1,
      })
    }
  }

  for (const p of judged) {
    const missed = (p.pointsEarned ?? 0) === 0
    addStat(p.match.homeTeam, missed)
    addStat(p.match.awayTeam, missed)
  }

  // Filtre les équipes qui atteignent le seuil
  const eligible = Array.from(byTeam.values()).filter(
    (t) => t.missedCount >= WORST_TEAM_MIN_MISSED,
  )

  if (eligible.length === 0) return null

  // Tri
  eligible.sort((a, b) => {
    if (b.missedCount !== a.missedCount) return b.missedCount - a.missedCount
    if (b.totalMatches !== a.totalMatches) return b.totalMatches - a.totalMatches
    return a.name.localeCompare(b.name)
  })

  return eligible[0]
}

// ============================================
// 11. RANKING TREND — Évolution du classement entre J(n) et J(n-1)
// ============================================
// À AJOUTER DANS src/lib/dashboard-data.ts (après getWorstTeamForUser).
//
// Calcule la différence de position au classement Panenka entre :
//   - le classement APRÈS la dernière matchday FINISHED (= maintenant)
//   - le classement APRÈS l'avant-dernière matchday FINISHED
//
// Trend "up" → j'ai gagné des places (delta positif)
// Trend "down" → j'ai perdu des places (delta négatif)
// Trend "stable" → pas de changement (delta = 0)
// Trend "first" → pas assez de matchdays FINISHED pour comparer (saison qui démarre)

export type RankingTrend = {
  trend: "up" | "down" | "stable" | "first"
  /** Position après la dernière matchday FINISHED */
  currentPosition: number | null
  /** Position après l'avant-dernière matchday FINISHED */
  previousPosition: number | null
  /** Nombre de places gagnées (positif) ou perdues (négatif). 0 si stable. */
  delta: number
  /** Numéro de la matchday "actuelle" du trend (la dernière FINISHED) */
  matchdayNumber: number | null
  /** Usernames des joueurs dépassés cette semaine (pour le futur "poc") */
  overtakenUsernames: string[]
}

/**
 * Helper : calcule la position de chaque user au classement à un instant T,
 * donné par le set d'IDs de matchdays à inclure dans le calcul.
 *
 * Retourne une Map<userId, position> avec gestion des ex-aequo (1, 1, 3...).
 */
export async function getRankingAtMatchdays(
  matchdayIds: string[],
): Promise<Map<string, { position: number; points: number; username: string }>> {
  const result = new Map<string, { position: number; points: number; username: string }>()
  if (matchdayIds.length === 0) return result

  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  })

  const predictions = await prisma.prediction.findMany({
    where: {
      pointsEarned: { not: null },
      match: { matchdayId: { in: matchdayIds } },
    },
    select: { userId: true, pointsEarned: true },
  })

  const pointsByUser = new Map<string, number>()
  for (const p of predictions) {
    pointsByUser.set(
      p.userId,
      (pointsByUser.get(p.userId) ?? 0) + (p.pointsEarned ?? 0),
    )
  }

  const sorted = users
    .map((u) => ({
      userId: u.id,
      username: u.username,
      points: pointsByUser.get(u.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return a.username.localeCompare(b.username)
    })

  let lastPoints = -1
  let lastRank = 0
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]
    const rank = entry.points !== lastPoints ? i + 1 : lastRank
    lastPoints = entry.points
    lastRank = rank
    result.set(entry.userId, {
      position: rank,
      points: entry.points,
      username: entry.username,
    })
  }

  return result
}

export async function getRankingTrend(userId: string): Promise<RankingTrend> {
  const empty: RankingTrend = {
    trend: "first",
    currentPosition: null,
    previousPosition: null,
    delta: 0,
    matchdayNumber: null,
    overtakenUsernames: [],
  }

  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return empty

  // Toutes les matchdays FINISHED, par ordre croissant
  const finishedMds = await prisma.matchday.findMany({
    where: { seasonId: season.id, status: "FINISHED" },
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  })

  // Moins de 2 matchdays FINISHED → pas de comparaison possible
  if (finishedMds.length === 0) return empty
  if (finishedMds.length === 1) {
    // Le user a un classement (= position après J1) mais pas de "before"
    const currentRanking = await getRankingAtMatchdays([finishedMds[0].id])
    const me = currentRanking.get(userId)
    return {
      ...empty,
      trend: "first",
      currentPosition: me?.position ?? null,
      matchdayNumber: finishedMds[0].number,
    }
  }

  // À partir de 2 matchdays FINISHED, on peut comparer
  const lastMd = finishedMds[finishedMds.length - 1]
  const previousFinishedIds = finishedMds.slice(0, -1).map((m) => m.id)
  const allFinishedIds = finishedMds.map((m) => m.id)

  const previousRanking = await getRankingAtMatchdays(previousFinishedIds)
  const currentRanking = await getRankingAtMatchdays(allFinishedIds)

  const me = currentRanking.get(userId)
  const meBefore = previousRanking.get(userId)
  if (!me || !meBefore) return empty

  // Delta = previousPosition - currentPosition
  // → positif si je suis remonté (ex: était 5e, maintenant 3e → +2)
  const delta = meBefore.position - me.position

  // Détermine la liste des joueurs que J'AI DÉPASSÉS cette matchday
  // (ils étaient devant moi avant, ils sont derrière maintenant)
  const overtakenUsernames: string[] = []
  if (delta > 0) {
    for (const [otherUserId, otherCurrent] of currentRanking) {
      if (otherUserId === userId) continue
      const otherBefore = previousRanking.get(otherUserId)
      if (!otherBefore) continue
      // Il était devant moi avant, je suis devant lui maintenant
      const wasAhead = otherBefore.position < meBefore.position
      const isBehind = otherCurrent.position > me.position
      if (wasAhead && isBehind) {
        overtakenUsernames.push(otherCurrent.username)
      }
    }
  }

  const trend: RankingTrend["trend"] =
    delta > 0 ? "up" : delta < 0 ? "down" : "stable"

  return {
    trend,
    currentPosition: me.position,
    previousPosition: meBefore.position,
    delta,
    matchdayNumber: lastMd.number,
    overtakenUsernames,
  }
}