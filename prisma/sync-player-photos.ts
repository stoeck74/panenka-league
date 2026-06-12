import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is not defined in .env")

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const API_BASE = "https://v3.football.api-sports.io"

// ============================================
// MAPPING Football-Data ID → api-football ID
// Basé sur la saison L1 2024/25
// Lorient (525) et Paris FC (1045) absents → pas de photos
// ============================================
const FD_TO_AFB: Record<number, number> = {
  519: 108,  // AJ Auxerre
  548:  91,  // AS Monaco FC
  532:  77,  // Angers SCO
  545: 112,  // FC Metz
  543:  83,  // FC Nantes
  533: 111,  // Le Havre AC
  521:  79,  // Lille OSC
  522:  84,  // OGC Nice
  523:  80,  // Olympique Lyonnais
  516:  81,  // Olympique de Marseille
  524:  85,  // Paris Saint-Germain FC
  576:  95,  // RC Strasbourg Alsace
  546: 116,  // Racing Club de Lens
  512: 106,  // Stade Brestois 29
  529:  94,  // Stade Rennais FC 1901
  511:  96,  // Toulouse FC
}

// ============================================
// TYPES
// ============================================
type AfbPlayer = {
  id: number
  name: string
  position: string
  photo: string
}

type AfbSquadResponse = {
  response: Array<{
    team: { id: number; name: string }
    players: AfbPlayer[]
  }>
  errors: Record<string, string> | []
}

// ============================================
// HELPERS
// ============================================

async function fetchSquad(afbTeamId: number): Promise<AfbPlayer[]> {
  const token = process.env.API_FOOTBALL_KEY
  if (!token) throw new Error("API_FOOTBALL_KEY is not defined in .env")

  const res = await fetch(`${API_BASE}/players/squads?team=${afbTeamId}`, {
    headers: { "x-apisports-key": token },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json() as AfbSquadResponse
  return data.response?.[0]?.players ?? []
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Normalise un nom pour le matching :
 * "S. Bajić" → "bajic"
 * "Stefan Bajić" → "bajic"
 * On prend le dernier mot (nom de famille) + on retire les accents
 */
function normalizeName(name: string): string {
  return name
    .split(" ")
    .pop()!
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "")
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("📸 Sync photos joueurs — démarrage")

  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  })
  if (!season) {
    console.error("❌ Aucune saison active en DB.")
    process.exit(1)
  }
  console.log(`📅 Saison active : ${season.name}`)

  // Récupère les équipes de la saison active avec leur externalId Football-Data
  const seasonTeams = await prisma.seasonTeam.findMany({
    where: { seasonId: season.id },
    include: {
      team: { select: { id: true, name: true, externalId: true } },
    },
  })

  let totalPhotosUpdated = 0
  let totalNotMatched = 0
  let teamsProcessed = 0

  for (const { team } of seasonTeams) {
    teamsProcessed++
    const afbId = FD_TO_AFB[team.externalId]

    if (!afbId) {
      console.log(`[${teamsProcessed}/${seasonTeams.length}] ${team.name} → pas de mapping api-football, skip`)
      continue
    }

    process.stdout.write(`[${teamsProcessed}/${seasonTeams.length}] ${team.name}... `)

    try {
      // Récupère les joueurs de cette équipe en DB
      const dbPlayers = await prisma.player.findMany({
        where: { teamId: team.id },
        select: { id: true, name: true },
      })

      // Récupère le squad depuis api-football
      const afbPlayers = await fetchSquad(afbId)

      // Construit un index par nom de famille normalisé → photo URL
      const photoByLastName = new Map<string, string>()
      for (const p of afbPlayers) {
        photoByLastName.set(normalizeName(p.name), p.photo)
      }



      // Match et update
      let matched = 0
      let notMatched = 0

      for (const dbPlayer of dbPlayers) {
        const normalizedName = normalizeName(dbPlayer.name)
        const photoUrl = photoByLastName.get(normalizedName)

        if (photoUrl) {
          await prisma.player.update({
            where: { id: dbPlayer.id },
            data: { photoUrl },
          })
          matched++
          totalPhotosUpdated++
        } else {
          notMatched++
          totalNotMatched++
        }
      }

      console.log(`${matched} photos ✓ (${notMatched} non matchés)`)

    } catch (error) {
      console.log(`❌ ERREUR`)
      console.error(` `, error instanceof Error ? error.message : error)
    }

    // Rate limit api-football : ~30 req/min sur free tier → 2s suffisent
    if (teamsProcessed < seasonTeams.length) {
      await sleep(2500)
    }
  }

  const withPhotos = await prisma.player.count({ where: { photoUrl: { not: null } } })
  const total = await prisma.player.count()

  console.log("\n========================================")
  console.log(`✓ ${totalPhotosUpdated} photos ajoutées`)
  console.log(`⚠️  ${totalNotMatched} joueurs sans photo (noms non matchés)`)
  console.log(`📊 ${withPhotos}/${total} joueurs avec photo en DB`)
  console.log("========================================")
  console.log("\n💡 Ajoute API_FOOTBALL_KEY dans ton .env :")
  console.log("   API_FOOTBALL_KEY=ta_cle_ici")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })