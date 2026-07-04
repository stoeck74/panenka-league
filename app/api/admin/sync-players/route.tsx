import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"

const API_BASE = "https://api.football-data.org/v4"

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchSquad(
  teamExternalId: number,
  maxRetries: number = 3,
): Promise<Array<{ id: number; name: string; position: string | null; nationality: string | null }>> {
  const token = process.env.FOOTBALL_DATA_API_KEY
  if (!token) throw new Error("FOOTBALL_DATA_API_KEY not configured")

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(`${API_BASE}/teams/${teamExternalId}`, {
      headers: { "X-Auth-Token": token },
      cache: "no-store",
    })

    if (res.ok) {
      const data = (await res.json()) as {
        squad: Array<{ id: number; name: string; position: string | null; nationality: string | null }>
      }
      return data.squad ?? []
    }

    // Rate limit : on respecte le header Retry-After s'il est présent,
    // sinon backoff progressif (30s, 60s, 90s...). On réessaie au lieu
    // d'abandonner immédiatement, car un 429 isolé ne veut pas dire que
    // le token est mauvais — juste qu'il faut ralentir.
    if (res.status === 429 && attempt < maxRetries) {
      const retryAfterHeader = res.headers.get("Retry-After")
      const waitMs = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : 30000 * (attempt + 1)
      console.warn(
        `[sync-players] 429 pour l'équipe ${teamExternalId}, retry dans ${waitMs / 1000}s (tentative ${attempt + 1}/${maxRetries})`,
      )
      await sleep(waitMs)
      continue
    }

    throw new Error(`API error ${res.status}`)
  }

  throw new Error(`API error 429 après ${maxRetries} tentatives`)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  // Async — réponse immédiate, sync en background
  const runSync = async () => {
    const season = await prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true },
    })
    if (!season) return

    const seasonTeams = await prisma.seasonTeam.findMany({
      where: { seasonId: season.id },
      include: { team: { select: { id: true, name: true, externalId: true } } },
    })

    let total = 0
    for (let i = 0; i < seasonTeams.length; i++) {
      const { team } = seasonTeams[i]
      if (i > 0) await sleep(7000)

      try {
        const squad = await fetchSquad(team.externalId)
        for (const p of squad) {
          if (!p.position || EXCLUDED_POSITIONS.has(p.position)) continue
          await prisma.player.upsert({
            where: { externalId: p.id },
            create: { externalId: p.id, name: p.name, position: p.position, nationality: p.nationality, teamId: team.id },
            update: { name: p.name, position: p.position, nationality: p.nationality, teamId: team.id },
          })
          total++
        }
      } catch (e) {
        console.error(`[sync-players] ${team.name}:`, e)
      }
    }
    console.log(`[sync-players] Done: ${total} joueurs`)
  }

  // Lance en background (durée ~2 min à cause du rate limiting Football-Data)
  runSync().catch(console.error)

  return NextResponse.json({
    ok: true,
    message: "Sync joueurs démarrée en background (~2 min). Consulte les logs Vercel.",
  })
}