import * as dotenv from "dotenv"
import * as path from "path"
dotenv.config({ path: path.resolve(__dirname, "../.env") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const API_BASE = "https://api.football-data.org/v4"

// ============================================
// TYPES API
// ============================================

type ApiPlayer = {
  id: number
  name: string
  position: string | null
  nationality: string | null
}

type ApiTeamDetail = {
  id: number
  name: string
  squad: ApiPlayer[]
}

// Positions à EXCLURE (gardiens + défenseurs, tous formats confondus)
const EXCLUDED_POSITIONS = new Set([
  "Goalkeeper",
  "Defence",
  "Defender",
  "Centre-Back",
  "Left-Back",
  "Right-Back",
  "Full-Back",
  "Sweeper",
  "Wing-Back",
])

// ============================================
// HELPERS
// ============================================

async function fetchTeamDetail(
  teamExternalId: number,
  maxRetries: number = 3,
): Promise<ApiTeamDetail> {
  const token = process.env.FOOTBALL_DATA_API_KEY
  if (!token) throw new Error("FOOTBALL_DATA_API_KEY is not defined in .env")

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${API_BASE}/teams/${teamExternalId}`, {
      headers: { "X-Auth-Token": token },
      cache: "no-store",
    } as RequestInit)

    if (response.ok) {
      return response.json()
    }

    // Rate limit : on respecte Retry-After si présent, sinon backoff
    // progressif (30s, 60s, 90s...), plutôt que d'abandonner direct.
    if (response.status === 429 && attempt < maxRetries) {
      const retryAfterHeader = response.headers.get("Retry-After")
      const waitMs = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : 30000 * (attempt + 1)
      console.log(`\n  ⏳ 429, retry dans ${waitMs / 1000}s (tentative ${attempt + 1}/${maxRetries})`)
      await sleep(waitMs)
      continue
    }

    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }

  throw new Error(`API error 429 après ${maxRetries} tentatives`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("⚽ Sync joueurs Panenka League — démarrage")

  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  })
  if (!season) {
    console.error("❌ Aucune saison active en DB.")
    process.exit(1)
  }
  console.log(`📅 Saison active : ${season.name}`)

  const seasonTeams = await prisma.seasonTeam.findMany({
    where: { seasonId: season.id },
    include: {
      team: { select: { id: true, name: true, externalId: true } },
    },
  })

  console.log(`📋 ${seasonTeams.length} équipes à traiter`)
  console.log("⏳ Rate limit 10 calls/min → 7s entre chaque équipe\n")

  let totalPlayersImported = 0
  let totalSkipped = 0
  let teamsProcessed = 0

  for (const { team } of seasonTeams) {
    teamsProcessed++
    process.stdout.write(`[${teamsProcessed}/${seasonTeams.length}] ${team.name}... `)

    try {
      const apiTeam = await fetchTeamDetail(team.externalId)

      if (!apiTeam.squad || apiTeam.squad.length === 0) {
        console.log(`⚠️  Pas de squad disponible`)
        if (teamsProcessed < seasonTeams.length) await sleep(7000)
        continue
      }

      let playersInTeam = 0
      let skippedInTeam = 0

      for (const apiPlayer of apiTeam.squad) {
        // Exclut gardiens + défenseurs (tous formats de position confondus)
        // Garde milieux et attaquants sous toutes leurs dénominations :
        // "Midfield", "Central Midfield", "Defensive Midfield", "Attacking Midfield"
        // "Offence", "Centre-Forward", "Left Winger", "Right Winger", etc.
        if (!apiPlayer.position || EXCLUDED_POSITIONS.has(apiPlayer.position)) {
          skippedInTeam++
          continue
        }

        await prisma.player.upsert({
          where: { externalId: apiPlayer.id },
          create: {
            externalId: apiPlayer.id,
            name: apiPlayer.name,
            position: apiPlayer.position,
            nationality: apiPlayer.nationality,
            teamId: team.id,
          },
          update: {
            name: apiPlayer.name,
            position: apiPlayer.position,
            nationality: apiPlayer.nationality,
            teamId: team.id,
          },
        })

        playersInTeam++
      }

      totalPlayersImported += playersInTeam
      totalSkipped += skippedInTeam
      console.log(`${playersInTeam} joueurs ✓ (${skippedInTeam} def/gk skippés)`)

    } catch (error) {
      console.log(`❌ ERREUR`)
      console.error(` `, error instanceof Error ? error.message : error)
    }

    if (teamsProcessed < seasonTeams.length) {
      process.stdout.write(`  ⏳ Attente 7s... `)
      await sleep(7000)
      console.log(`ok`)
    }
  }

  const total = await prisma.player.count()
  console.log("\n========================================")
  console.log(`✓ ${totalPlayersImported} joueurs upsertés`)
  console.log(`✓ ${totalSkipped} défenseurs/gardiens skippés`)
  console.log(`✓ Total en DB : ${total}`)
  console.log("========================================")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })