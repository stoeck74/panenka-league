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

async function fetchSquad(teamExternalId: number) {
  const token = process.env.FOOTBALL_DATA_API_KEY
  if (!token) throw new Error("FOOTBALL_DATA_API_KEY not configured")

  const res = await fetch(`${API_BASE}/teams/${teamExternalId}`, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json() as { squad: Array<{ id: number; name: string; position: string | null; nationality: string | null }> }
  return data.squad ?? []
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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