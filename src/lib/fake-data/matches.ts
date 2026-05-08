// ============================================
// FAKE DATA — Page Matchs
// 9 matchs de la J22, prêts pour les pronos
// ============================================

export type MatchStatus = "scheduled" | "live" | "finished" | "locked"

export type FakeMatchTeam = {
  name: string
  shortName: string
  tla: string
  crest: string
}

export type FakeMatchDetailed = {
  id: string
  matchday: number
  homeTeam: FakeMatchTeam
  awayTeam: FakeMatchTeam
  kickoffDate: string // "Vendredi 9 mai"
  kickoffTime: string // "21:00"
  status: MatchStatus
  // Si match joué :
  homeScore?: number
  awayScore?: number
  // Mon prono actuel (peut être null si pas encore fait) :
  myHomePrediction?: number | null
  myAwayPrediction?: number | null
  isBanco?: boolean
  // Si match terminé :
  myPoints?: number
}

const TEAMS: Record<string, FakeMatchTeam> = {
  PSG: {
    name: "Paris Saint-Germain",
    shortName: "Paris",
    tla: "PSG",
    crest: "https://crests.football-data.org/524.png",
  },
  OM: {
    name: "Olympique de Marseille",
    shortName: "Marseille",
    tla: "OM",
    crest: "https://crests.football-data.org/516.png",
  },
  OL: {
    name: "Olympique Lyonnais",
    shortName: "Lyon",
    tla: "OL",
    crest: "https://crests.football-data.org/523.png",
  },
  ASM: {
    name: "AS Monaco",
    shortName: "Monaco",
    tla: "ASM",
    crest: "https://crests.football-data.org/548.png",
  },
  LOSC: {
    name: "Lille OSC",
    shortName: "Lille",
    tla: "LIL",
    crest: "https://crests.football-data.org/521.png",
  },
  RENNES: {
    name: "Stade Rennais",
    shortName: "Rennes",
    tla: "REN",
    crest: "https://crests.football-data.org/512.png",
  },
  NICE: {
    name: "OGC Nice",
    shortName: "Nice",
    tla: "NIC",
    crest: "https://crests.football-data.org/522.png",
  },
  STRASBOURG: {
    name: "RC Strasbourg",
    shortName: "Strasbourg",
    tla: "STR",
    crest: "https://crests.football-data.org/576.png",
  },
  LENS: {
    name: "RC Lens",
    shortName: "Lens",
    tla: "LEN",
    crest: "https://crests.football-data.org/546.png",
  },
  NANTES: {
    name: "FC Nantes",
    shortName: "Nantes",
    tla: "NAN",
    crest: "https://crests.football-data.org/543.png",
  },
  REIMS: {
    name: "Stade de Reims",
    shortName: "Reims",
    tla: "REI",
    crest: "https://crests.football-data.org/547.png",
  },
  TOULOUSE: {
    name: "Toulouse FC",
    shortName: "Toulouse",
    tla: "TLS",
    crest: "https://crests.football-data.org/511.png",
  },
  MONTPELLIER: {
    name: "Montpellier HSC",
    shortName: "Montpellier",
    tla: "MTP",
    crest: "https://crests.football-data.org/518.png",
  },
  BREST: {
    name: "Stade Brestois",
    shortName: "Brest",
    tla: "BRE",
    crest: "https://crests.football-data.org/512.png",
  },
  AUXERRE: {
    name: "AJ Auxerre",
    shortName: "Auxerre",
    tla: "AUX",
    crest: "https://crests.football-data.org/519.png",
  },
  ANGERS: {
    name: "Angers SCO",
    shortName: "Angers",
    tla: "ANG",
    crest: "https://crests.football-data.org/536.png",
  },
  LE_HAVRE: {
    name: "Le Havre AC",
    shortName: "Le Havre",
    tla: "HAC",
    crest: "https://crests.football-data.org/523.png",
  },
  SAINT_ETIENNE: {
    name: "AS Saint-Etienne",
    shortName: "Saint-Étienne",
    tla: "ASSE",
    crest: "https://crests.football-data.org/527.png",
  },
}

export const fakeJ22Matches: FakeMatchDetailed[] = [
  {
    id: "j22-1",
    matchday: 22,
    homeTeam: TEAMS.PSG,
    awayTeam: TEAMS.OM,
    kickoffDate: "Vendredi 9 mai",
    kickoffTime: "21:00",
    status: "scheduled",
    myHomePrediction: null,
    myAwayPrediction: null,
    isBanco: false,
  },
  {
    id: "j22-2",
    matchday: 22,
    homeTeam: TEAMS.OL,
    awayTeam: TEAMS.LOSC,
    kickoffDate: "Samedi 10 mai",
    kickoffTime: "17:00",
    status: "scheduled",
    myHomePrediction: 2,
    myAwayPrediction: 1,
    isBanco: false,
  },
  {
    id: "j22-3",
    matchday: 22,
    homeTeam: TEAMS.ASM,
    awayTeam: TEAMS.RENNES,
    kickoffDate: "Samedi 10 mai",
    kickoffTime: "21:00",
    status: "scheduled",
    myHomePrediction: 2,
    myAwayPrediction: 0,
    isBanco: true,
  },
  {
    id: "j22-4",
    matchday: 22,
    homeTeam: TEAMS.NICE,
    awayTeam: TEAMS.LENS,
    kickoffDate: "Dimanche 11 mai",
    kickoffTime: "13:00",
    status: "scheduled",
    myHomePrediction: null,
    myAwayPrediction: null,
    isBanco: false,
  },
  {
    id: "j22-5",
    matchday: 22,
    homeTeam: TEAMS.STRASBOURG,
    awayTeam: TEAMS.NANTES,
    kickoffDate: "Dimanche 11 mai",
    kickoffTime: "15:00",
    status: "scheduled",
    myHomePrediction: 1,
    myAwayPrediction: 1,
    isBanco: false,
  },
  {
    id: "j22-6",
    matchday: 22,
    homeTeam: TEAMS.REIMS,
    awayTeam: TEAMS.TOULOUSE,
    kickoffDate: "Dimanche 11 mai",
    kickoffTime: "15:00",
    status: "scheduled",
    myHomePrediction: null,
    myAwayPrediction: null,
    isBanco: false,
  },
  {
    id: "j22-7",
    matchday: 22,
    homeTeam: TEAMS.MONTPELLIER,
    awayTeam: TEAMS.BREST,
    kickoffDate: "Dimanche 11 mai",
    kickoffTime: "15:00",
    status: "scheduled",
    myHomePrediction: 0,
    myAwayPrediction: 2,
    isBanco: false,
  },
  {
    id: "j22-8",
    matchday: 22,
    homeTeam: TEAMS.AUXERRE,
    awayTeam: TEAMS.ANGERS,
    kickoffDate: "Dimanche 11 mai",
    kickoffTime: "17:00",
    status: "scheduled",
    myHomePrediction: 1,
    myAwayPrediction: 0,
    isBanco: false,
  },
  {
    id: "j22-9",
    matchday: 22,
    homeTeam: TEAMS.LE_HAVRE,
    awayTeam: TEAMS.SAINT_ETIENNE,
    kickoffDate: "Dimanche 11 mai",
    kickoffTime: "21:00",
    status: "scheduled",
    myHomePrediction: null,
    myAwayPrediction: null,
    isBanco: false,
  },
]

// Liste des journées (pour le sélecteur en haut de la page)
export type FakeMatchday = {
  number: number
  status: "past" | "current" | "future"
  matchesCount: number
}

export const fakeMatchdays: FakeMatchday[] = [
  { number: 19, status: "past", matchesCount: 9 },
  { number: 20, status: "past", matchesCount: 9 },
  { number: 21, status: "past", matchesCount: 9 },
  { number: 22, status: "current", matchesCount: 9 },
  { number: 23, status: "future", matchesCount: 9 },
  { number: 24, status: "future", matchesCount: 9 },
  { number: 25, status: "future", matchesCount: 9 },
]