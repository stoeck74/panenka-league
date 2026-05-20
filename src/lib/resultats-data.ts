// ============================================
// RESULTATS DATA
// ============================================
// Calcule le classement officiel de la L1 à partir de nos matchs DB.
// Pas d'appel API : on a déjà toutes les données nécessaires.

import { prisma } from "@/lib/prisma"

const POINTS_WIN = 3
const POINTS_DRAW = 1
const POINTS_LOSS = 0
const FORM_LAST_N = 5

export type FormResult = "W" | "D" | "L"

export type StandingEntry = {
  rank: number
  teamId: string
  name: string
  shortName: string
  tla: string
  crestUrl: string | null
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form: FormResult[] // du plus ancien au plus récent
  isFavorite: boolean
}

export type ResultatsPageData = {
  seasonName: string
  lastPlayedMatchday: number | null
  standings: StandingEntry[]
}

/**
 * Calcule le classement Ligue 1 actuel (après la dernière journée jouée).
 *
 * Source : tous les matchs FINISHED de la saison active en DB.
 * Barème : 3/1/0 standard.
 * Tri : Points DESC, Diff DESC, BP DESC, Nom ASC (départage à 4 niveaux).
 *
 * @param favoriteTeamId Optionnel : pour highlighter l'équipe favorite
 *                       de l'utilisateur connecté.
 */
export async function getResultatsPageData(
  favoriteTeamId?: string | null,
): Promise<ResultatsPageData | null> {
  // 1. Saison active
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  })
  if (!season) return null

  // 2. Toutes les équipes de la saison
  const seasonTeams = await prisma.seasonTeam.findMany({
    where: { seasonId: season.id },
    include: {
      team: {
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
  if (seasonTeams.length === 0) return null

  // 3. Tous les matchs FINISHED de la saison
  const matches = await prisma.match.findMany({
    where: {
      status: "FINISHED",
      homeScore: { not: null },
      awayScore: { not: null },
      matchday: { seasonId: season.id },
    },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      kickoffAt: true,
      matchday: { select: { number: true } },
    },
    orderBy: { kickoffAt: "asc" },
  })

  // 4. Init des stats pour chaque équipe
  type Stats = Omit<StandingEntry, "rank">
  const statsByTeamId = new Map<string, Stats>()
  for (const st of seasonTeams) {
    statsByTeamId.set(st.team.id, {
      teamId: st.team.id,
      name: st.team.name,
      shortName: st.team.shortName,
      tla: st.team.tla,
      crestUrl: st.team.crestUrl,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      form: [],
      isFavorite: favoriteTeamId ? st.team.id === favoriteTeamId : false,
    })
  }

  // 5. Calcul match par match (matchs déjà triés par kickoff ASC,
  //    donc la `form` se construit naturellement du plus ancien au plus récent)
  let lastPlayedMatchday: number | null = null

  for (const m of matches) {
    const home = statsByTeamId.get(m.homeTeamId)
    const away = statsByTeamId.get(m.awayTeamId)
    if (!home || !away) continue // équipe inconnue ? skip

    const hs = m.homeScore!
    const as = m.awayScore!

    home.played++
    away.played++
    home.goalsFor += hs
    home.goalsAgainst += as
    away.goalsFor += as
    away.goalsAgainst += hs

    if (hs > as) {
      home.wins++
      home.points += POINTS_WIN
      away.losses++
      home.form.push("W")
      away.form.push("L")
    } else if (hs < as) {
      away.wins++
      away.points += POINTS_WIN
      home.losses++
      home.form.push("L")
      away.form.push("W")
    } else {
      home.draws++
      away.draws++
      home.points += POINTS_DRAW
      away.points += POINTS_DRAW
      home.form.push("D")
      away.form.push("D")
    }

    lastPlayedMatchday = m.matchday.number
  }

  // 6. Diff de buts + ne garder que les N derniers résultats de forme
  for (const stats of statsByTeamId.values()) {
    stats.goalDiff = stats.goalsFor - stats.goalsAgainst
    stats.form = stats.form.slice(-FORM_LAST_N)
  }

  // 7. Tri (4 niveaux de départage)
  const sorted = Array.from(statsByTeamId.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.name.localeCompare(b.name)
  })

  // 8. Rangs (1, 2, 3... sans ex-aequo pour un classement sportif)
  const standings: StandingEntry[] = sorted.map((stats, index) => ({
    rank: index + 1,
    ...stats,
  }))

  return {
    seasonName: season.name,
    lastPlayedMatchday,
    standings,
  }
}