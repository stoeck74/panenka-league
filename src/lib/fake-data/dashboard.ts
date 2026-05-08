// ============================================
// FAKE DATA — Dashboard
// À remplacer par de vraies données API plus tard
// ============================================

export const fakeUser = {
  username: "stoeck74",
  position: 3,
  totalPlayers: 8,
  totalPoints: 47,
  pointsLastMatchday: 5,
  exactScores: 4,
  goodResults: 12,
  successRate: 68,
}

export const fakeNextMatchday = {
  number: 22,
  startDate: "Vendredi 9 mai",
  startTime: "21:00",
  matchesCount: 9,
  predictionsMade: 0,
  bancosUsed: 0,
}

export const fakeLastMatchday = {
  number: 21,
  pointsEarned: 5,
  bestPlayer: "marco_pronos",
  bestPlayerPoints: 12,
}

export type FakeTeam = {
  name: string
  shortName: string
  tla: string
  crest: string
}

export type FakeMatch = {
  id: string
  homeTeam: FakeTeam
  awayTeam: FakeTeam
  kickoff: string
  date: string
}

// Quelques équipes Ligue 1 — blasons depuis football-data.org
const TEAMS: Record<string, FakeTeam> = {
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
    tla: "LOSC",
    crest: "https://crests.football-data.org/521.png",
  },
  RENNES: {
    name: "Stade Rennais FC",
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
  STRASB: {
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
}

export const fakeUpcomingMatches: FakeMatch[] = [
  {
    id: "1",
    homeTeam: TEAMS.PSG,
    awayTeam: TEAMS.OM,
    kickoff: "21:00",
    date: "Vendredi 9 mai",
  },
  {
    id: "2",
    homeTeam: TEAMS.OL,
    awayTeam: TEAMS.LOSC,
    kickoff: "17:00",
    date: "Samedi 10 mai",
  },
  {
    id: "3",
    homeTeam: TEAMS.ASM,
    awayTeam: TEAMS.RENNES,
    kickoff: "21:00",
    date: "Samedi 10 mai",
  },
  {
    id: "4",
    homeTeam: TEAMS.NICE,
    awayTeam: TEAMS.LENS,
    kickoff: "13:00",
    date: "Dimanche 11 mai",
  },
  {
    id: "5",
    homeTeam: TEAMS.STRASB,
    awayTeam: TEAMS.PSG,
    kickoff: "15:00",
    date: "Dimanche 11 mai",
  },
]

export type FakeRanking = {
  position: number
  username: string
  points: number
  isCurrentUser: boolean
}

export const fakeRanking: FakeRanking[] = [
  { position: 1, username: "marco_pronos", points: 58, isCurrentUser: false },
  { position: 2, username: "lucky_luke", points: 52, isCurrentUser: false },
  { position: 3, username: "stoeck74", points: 47, isCurrentUser: true },
  { position: 4, username: "thibault_om", points: 43, isCurrentUser: false },
  { position: 5, username: "fabrice_psg", points: 39, isCurrentUser: false },
]

export type FakeRecentResult = {
  id: string
  homeTeam: FakeTeam
  awayTeam: FakeTeam
  homeScore: number
  awayScore: number
  myPrediction: string
  myPoints: number
  isBanco: boolean
}

export const fakeRecentResults: FakeRecentResult[] = [
  {
    id: "r1",
    homeTeam: TEAMS.PSG,
    awayTeam: TEAMS.LOSC,
    homeScore: 3,
    awayScore: 1,
    myPrediction: "2-1",
    myPoints: 1,
    isBanco: false,
  },
  {
    id: "r2",
    homeTeam: TEAMS.OM,
    awayTeam: TEAMS.OL,
    homeScore: 2,
    awayScore: 2,
    myPrediction: "2-2",
    myPoints: 3,
    isBanco: true,
  },
  {
    id: "r3",
    homeTeam: TEAMS.ASM,
    awayTeam: TEAMS.NICE,
    homeScore: 1,
    awayScore: 0,
    myPrediction: "0-2",
    myPoints: 0,
    isBanco: false,
  },
  {
    id: "r4",
    homeTeam: TEAMS.RENNES,
    awayTeam: TEAMS.STRASB,
    homeScore: 2,
    awayScore: 1,
    myPrediction: "2-1",
    myPoints: 3,
    isBanco: false,
  },
]