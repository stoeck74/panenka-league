import "dotenv/config"
import { prisma } from "../src/lib/prisma"

const API_BASE = "https://api.football-data.org/v4"
const LIGUE_1_CODE = "FL1"

type ApiTeam = {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

type ApiResponse = {
  count: number
  teams: ApiTeam[]
}

async function fetchLigue1Teams(): Promise<ApiTeam[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY

  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY manquante dans .env")
  }

  console.log("🌐 Appel à football-data.org pour récupérer les équipes Ligue 1...")

  const response = await fetch(`${API_BASE}/competitions/${LIGUE_1_CODE}/teams`, {
    headers: {
      "X-Auth-Token": apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  const data: ApiResponse = await response.json()
  console.log(`✅ ${data.count} équipes récupérées depuis l'API`)

  return data.teams
}

async function seedTeams() {
  console.log("🌱 Démarrage du seed des équipes Ligue 1...\n")

  const apiTeams = await fetchLigue1Teams()

  console.log("\n💾 Insertion en base...")

  for (const apiTeam of apiTeams) {
    const team = await prisma.team.upsert({
      where: { externalId: apiTeam.id },
      update: {
        name: apiTeam.name,
        shortName: apiTeam.shortName,
        tla: apiTeam.tla,
        crestUrl: apiTeam.crest,
      },
      create: {
        externalId: apiTeam.id,
        name: apiTeam.name,
        shortName: apiTeam.shortName,
        tla: apiTeam.tla,
        crestUrl: apiTeam.crest,
      },
    })
    console.log(`  ✓ ${team.tla} - ${team.name}`)
  }

  console.log("\n✅ Seed terminé !")
}

seedTeams()
  .catch((e) => {
    console.error("❌ Erreur lors du seed :", e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })