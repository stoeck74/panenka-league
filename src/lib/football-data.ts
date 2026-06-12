// ============================================
// FOOTBALL-DATA.ORG API CLIENT
// Service qui fetch les données de la Ligue 1 (FL1)
// ============================================

const API_BASE = "https://api.football-data.org/v4"
const COMPETITION_CODE = "FL1"

// Types bruts de l'API
export type ApiTeam = {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

export type ApiMatch = {
  id: number
  utcDate: string
  status:
    | "TIMED"
    | "SCHEDULED"
    | "IN_PLAY"
    | "PAUSED"
    | "FINISHED"
    | "POSTPONED"
    | "SUSPENDED"
    | "CANCELLED"
    | "AWARDED"
  matchday: number
  homeTeam: ApiTeam
  awayTeam: ApiTeam
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null
    duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT"
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

export type ApiSeason = {
  id: number
  startDate: string
  endDate: string
  currentMatchday: number | null
}

type CompetitionResponse = {
  id: number
  name: string
  code: string
  currentSeason: ApiSeason
}

type MatchesResponse = {
  resultSet: { count: number; first: string; last: string; played: number }
  matches: ApiMatch[]
}

type TeamsResponse = {
  count: number
  teams: ApiTeam[]
}

// ============================================
// FETCH HELPER
// ============================================
async function apiFetch<T>(endpoint: string): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_KEY
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_KEY is not defined in .env")
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "X-Auth-Token": token,
    },
    // Pas de cache pour les données en live
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `football-data.org API error: ${response.status} ${response.statusText} — ${text}`
    )
  }

  return response.json() as Promise<T>
}

// ============================================
// PUBLIC API
// ============================================

/** Récupère les infos de la compétition + saison courante */
export async function fetchCompetition(): Promise<CompetitionResponse> {
  return apiFetch<CompetitionResponse>(`/competitions/${COMPETITION_CODE}`)
}

/** Récupère les 18 équipes de Ligue 1 */
export async function fetchTeams(): Promise<ApiTeam[]> {
  const data = await apiFetch<TeamsResponse>(`/competitions/${COMPETITION_CODE}/teams`)
  return data.teams
}

/** Récupère tous les matchs de la saison courante (306 = 34 × 9) */
export async function fetchMatches(): Promise<ApiMatch[]> {
  const data = await apiFetch<MatchesResponse>(`/competitions/${COMPETITION_CODE}/matches`)
  return data.matches
}

// ============================================
// MAPPERS (API → DB)
// ============================================

/** Map le statut API vers notre enum DB */
export function mapMatchStatus(
  apiStatus: ApiMatch["status"]
): "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" {
  switch (apiStatus) {
    case "TIMED":
    case "SCHEDULED":
      return "SCHEDULED"
    case "IN_PLAY":
    case "PAUSED":
      return "LIVE"
    case "FINISHED":
    case "AWARDED":
      return "FINISHED"
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
      return "POSTPONED"
    default:
      return "SCHEDULED"
  }
}

/**
 * Déduit le statut UI d'une matchday depuis l'état de ses matchs.
 *   FINISHED = tous joués ou reportés
 *   ACTIVE   = en cours (1er match a commencé OU dans moins d'1h)
 *   UPCOMING = sinon
 *
 * NB : ACTIVE = locked (plus de pronos possibles).
 */
export function deriveMatchdayStatus(
  matches: { status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED"; kickoffAt: Date }[],
  now: Date = new Date()
): "UPCOMING" | "ACTIVE" | "FINISHED" {
  if (matches.length === 0) return "UPCOMING"

  const allDone = matches.every(
    (m) => m.status === "FINISHED" || m.status === "POSTPONED"
  )
  if (allDone) return "FINISHED"

  const firstKickoff = matches
    .map((m) => m.kickoffAt.getTime())
    .reduce((min, t) => Math.min(min, t), Infinity)
  const oneHourBeforeFirst = firstKickoff - 60 * 60 * 1000

  if (now.getTime() >= oneHourBeforeFirst) return "ACTIVE"

  return "UPCOMING"
}

// ============================================
// SCORERS — Top buteurs de la compétition
// ============================================
// À AJOUTER DANS src/lib/football-data.ts
// (après la fonction fetchMatches, avant les mappers)

export type ApiScorer = {
  player: {
    id: number
    name: string
    nationality: string | null
    section: string | null  // "Offence", "Midfield", etc.
  }
  team: {
    id: number
    name: string
  }
  goals: number
  assists: number | null
  penalties: number | null
  playedMatches: number | null
}

type ScorersResponse = {
  count: number
  scorers: ApiScorer[]
}

/**
 * Récupère le top buteurs de la Ligue 1.
 * Par défaut, Football-Data renvoie 10 résultats. On peut demander plus
 * avec ?limit=20.
 *
 * @param limit Combien de buteurs récupérer (défaut: 15)
 */
export async function fetchScorers(limit: number = 15): Promise<ApiScorer[]> {
  const data = await apiFetch<ScorersResponse>(
    `/competitions/${COMPETITION_CODE}/scorers?limit=${limit}`
  )
  return data.scorers
}

// ============================================
// SQUADS — Joueurs par équipe
// ============================================

export type ApiPlayer = {
  id: number
  name: string
  position: "Goalkeeper" | "Defence" | "Midfield" | "Offence" | null
  nationality: string | null
}

type SquadResponse = {
  squad: ApiPlayer[]
}

/**
 * Récupère les joueurs d'une équipe.
 * On ne garde que les Midfield + Offence (éligibles Golden Boot).
 */
export async function fetchSquad(teamExternalId: number): Promise<ApiPlayer[]> {
  const data = await apiFetch<SquadResponse>(`/teams/${teamExternalId}`)
  return data.squad.filter(
    (p) => p.position === "Midfield" || p.position === "Offence",
  )
}