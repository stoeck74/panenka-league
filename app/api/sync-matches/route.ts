import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { recalculatePoints } from "@/lib/actions/recalculate-points"

import {
  fetchCompetition,
  fetchTeams,
  fetchMatches,
  fetchScorers,
  mapMatchStatus,
  deriveMatchdayStatus,
} from "@/lib/football-data"

// ============================================
// SYNC API → DB
// Endpoint appelé par un cron externe (cron-job.org)
// Sécurisé par un token en query param "?token=XXX"
//
// Modes :
//   - Normal (async) : réponse immédiate, sync en background
//   - ?wait=true     : attend la fin et retourne le log complet
//   - ?force=true    : recalcul forcé de tous les points
// ============================================

export async function GET(request: NextRequest) {
  const expectedToken = process.env.CRON_SECRET
  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 500 },
    )
  }

  const authHeader = request.headers.get("authorization")
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null
  const tokenFromQuery = request.nextUrl.searchParams.get("token")
  const providedToken = tokenFromHeader || tokenFromQuery

  if (providedToken !== expectedToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  const log: string[] = []
  const forceRecalc = request.nextUrl.searchParams.get("force") === "true"
  const waitForCompletion =
    forceRecalc || request.nextUrl.searchParams.get("wait") === "true"

  const runSync = async () => {
    try {
      // ============================================
      // ÉTAPE 1 — Season
      // ============================================
      const competition = await fetchCompetition()
      const apiSeason = competition.currentSeason
      const startYear = new Date(apiSeason.startDate).getUTCFullYear()
      const endYear = new Date(apiSeason.endDate).getUTCFullYear()
      const seasonName = `${competition.name} ${startYear}/${endYear}`

      await prisma.season.updateMany({
        where: { externalId: { not: apiSeason.id } },
        data: { isActive: false },
      })

      const season = await prisma.season.upsert({
        where: { externalId: apiSeason.id },
        create: {
          externalId: apiSeason.id,
          name: seasonName,
          startDate: new Date(apiSeason.startDate),
          endDate: new Date(apiSeason.endDate),
          isActive: true,
        },
        update: {
          name: seasonName,
          startDate: new Date(apiSeason.startDate),
          endDate: new Date(apiSeason.endDate),
          isActive: true,
        },
      })
      log.push(`✓ Season: ${season.name}`)

      // ============================================
      // ÉTAPE 2 — Équipes (batch transaction)
      // ============================================
      const apiTeams = await fetchTeams()

      const upsertedTeams = await prisma.$transaction(
        apiTeams.map((apiTeam) =>
          prisma.team.upsert({
            where: { externalId: apiTeam.id },
            create: {
              externalId: apiTeam.id,
              name: apiTeam.name,
              shortName: apiTeam.shortName,
              tla: apiTeam.tla,
              crestUrl: apiTeam.crest,
            },
            update: {
              name: apiTeam.name,
              shortName: apiTeam.shortName,
              tla: apiTeam.tla,
              crestUrl: apiTeam.crest,
            },
          }),
        ),
        { timeout: 30000 },
      )

      await prisma.$transaction(
        upsertedTeams.map((team) =>
          prisma.seasonTeam.upsert({
            where: { seasonId_teamId: { seasonId: season.id, teamId: team.id } },
            create: { seasonId: season.id, teamId: team.id },
            update: {},
          }),
        ),
        { timeout: 30000 },
      )

      log.push(`✓ ${upsertedTeams.length} équipes synchronisées`)

      // ============================================
      // ÉTAPE 3 — Matchs + Matchdays (batch transaction)
      // ============================================
      const apiMatches = await fetchMatches()
      const allTeams = await prisma.team.findMany()
      const teamIdByExternalId = new Map(allTeams.map((t) => [t.externalId, t.id]))

      const existingMatches = await prisma.match.findMany({
        select: { externalId: true, status: true },
      })
      const statusByExternalId = new Map(
        existingMatches.map((m) => [m.externalId, m.status]),
      )

      const matchesByMatchday = new Map<number, typeof apiMatches>()
      for (const m of apiMatches) {
        const list = matchesByMatchday.get(m.matchday) ?? []
        list.push(m)
        matchesByMatchday.set(m.matchday, list)
      }

      let matchdaysUpserted = 0
      let matchesUpserted = 0
      let matchesNewlyFinished = 0
      const newlyFinishedMatchIds: string[] = []

      // PHASE 1 : batch upsert Matchdays
      const matchdayUpsertOps = Array.from(matchesByMatchday.entries()).map(
        ([matchdayNumber, mdMatches]) => {
          const sortedKickoffs = mdMatches
            .map((m) => new Date(m.utcDate))
            .sort((a, b) => a.getTime() - b.getTime())
          const startDate = sortedKickoffs[0]
          const endDate = sortedKickoffs[sortedKickoffs.length - 1]
          const mdStatus = deriveMatchdayStatus(
            mdMatches.map((m) => ({
              status: mapMatchStatus(m.status),
              kickoffAt: new Date(m.utcDate),
            })),
          )
          return prisma.matchday.upsert({
            where: { seasonId_number: { seasonId: season.id, number: matchdayNumber } },
            create: { seasonId: season.id, number: matchdayNumber, status: mdStatus, startDate, endDate },
            update: { status: mdStatus, startDate, endDate },
          })
        },
      )
      const upsertedMatchdays = await prisma.$transaction(matchdayUpsertOps, { timeout: 30000 })
      matchdaysUpserted = upsertedMatchdays.length

      const matchdayIdByNumber = new Map(upsertedMatchdays.map((md) => [md.number, md.id]))

      // PHASE 2 : prépare les ops match
      const matchUpsertOps: Array<{
        apiMatchId: number
        justFinished: boolean
        op: ReturnType<typeof prisma.match.upsert>
      }> = []

      for (const [matchdayNumber, mdMatches] of matchesByMatchday) {
        const matchdayId = matchdayIdByNumber.get(matchdayNumber)
        if (!matchdayId) continue

        for (const apiMatch of mdMatches) {
          const homeTeamId = teamIdByExternalId.get(apiMatch.homeTeam.id)
          const awayTeamId = teamIdByExternalId.get(apiMatch.awayTeam.id)
          if (!homeTeamId || !awayTeamId) continue

          const newStatus = mapMatchStatus(apiMatch.status)
          const previousStatus = statusByExternalId.get(apiMatch.id)
          const justFinished =
            !!previousStatus && previousStatus !== "FINISHED" && newStatus === "FINISHED"
          if (justFinished) matchesNewlyFinished++

          matchUpsertOps.push({
            apiMatchId: apiMatch.id,
            justFinished,
            op: prisma.match.upsert({
              where: { externalId: apiMatch.id },
              create: {
                externalId: apiMatch.id,
                matchdayId,
                homeTeamId,
                awayTeamId,
                kickoffAt: new Date(apiMatch.utcDate),
                status: newStatus,
                homeScore: apiMatch.score.fullTime.home,
                awayScore: apiMatch.score.fullTime.away,
              },
              update: {
                matchdayId,
                homeTeamId,
                awayTeamId,
                kickoffAt: new Date(apiMatch.utcDate),
                status: newStatus,
                homeScore: apiMatch.score.fullTime.home,
                awayScore: apiMatch.score.fullTime.away,
              },
            }),
          })
        }
      }

      // PHASE 3 : batch upsert matchs
      const upsertedMatches = await prisma.$transaction(
        matchUpsertOps.map((m) => m.op),
        { timeout: 30000 },
      )

      // PHASE 4 : extraire les newly finished
      for (let i = 0; i < upsertedMatches.length; i++) {
        if (matchUpsertOps[i].justFinished) {
          newlyFinishedMatchIds.push(upsertedMatches[i].id)
        }
      }
      matchesUpserted = upsertedMatches.length

      log.push(
        `✓ ${matchdaysUpserted} journées + ${matchesUpserted} matchs synchronisés (${matchesNewlyFinished} nouveaux terminés)`,
      )

      // ============================================
      // ÉTAPE 4 — Top buteurs (batch transaction)
      // ============================================
      const apiScorers = await fetchScorers(15)

      const scorerOps = apiScorers
        .map((apiScorer, i) => {
          const teamId = teamIdByExternalId.get(apiScorer.team.id)
          if (!teamId) return null
          return prisma.scorer.upsert({
            where: { externalId: apiScorer.player.id },
            create: {
              externalId: apiScorer.player.id,
              name: apiScorer.player.name,
              seasonId: season.id,
              teamId,
              goals: apiScorer.goals,
              rank: i + 1,
            },
            update: {
              name: apiScorer.player.name,
              teamId,
              goals: apiScorer.goals,
              rank: i + 1,
            },
          })
        })
        .filter((op): op is NonNullable<typeof op> => op !== null)

      await prisma.$transaction(scorerOps, { timeout: 30000 })
      log.push(`✓ ${scorerOps.length} buteurs synchronisés`)

      // ============================================
      // ÉTAPE 5 — Recalcul des points
      // ============================================
      if (forceRecalc) {
        const pointsResult = await recalculatePoints()
        if (pointsResult.ok) {
          log.push(
            `✓ FORCE : ${pointsResult.predictionsUpdated} pronos recalculés sur ${pointsResult.matchesProcessed} matchs`,
          )
        } else {
          log.push(`⚠️ Erreur recalcul forcé : ${pointsResult.error}`)
        }
      } else if (newlyFinishedMatchIds.length > 0) {
        const pointsResult = await recalculatePoints(newlyFinishedMatchIds)
        if (pointsResult.ok) {
          log.push(
            `✓ ${pointsResult.predictionsUpdated} pronos recalculés sur ${pointsResult.matchesProcessed} matchs nouvellement terminés`,
          )
        } else {
          log.push(`⚠️ Erreur recalcul : ${pointsResult.error}`)
        }
      } else {
        log.push(`→ Aucun match nouvellement terminé, recalcul skip`)
      }

      const duration = Date.now() - startTime
      console.log(`[sync-matches] OK in ${duration}ms`, log)
      return { ok: true, duration: `${duration}ms`, log }

    } catch (error) {
      console.error("[sync-matches] Error:", error, "log so far:", log)
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        log,
      }
    }
  }

  // ============================================
  // EXÉCUTION : sync ou async ?
  // ============================================
  if (waitForCompletion) {
    const result = await runSync()
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } else {
    after(async () => { await runSync() })
    return NextResponse.json({
      ok: true,
      status: "Sync started in background. Check Vercel logs for completion.",
    })
  }
}