import { NextRequest, NextResponse } from "next/server"
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
// Sécurisé par un token dans le header "Authorization: Bearer XXX"
// ou en query param "?token=XXX"
// ============================================

export async function GET(request: NextRequest) {
  // Vérif token
  const expectedToken = process.env.CRON_SECRET
  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 500 }
    )
  }

  // Token via header Authorization (recommandé) OU query param (fallback)
  const authHeader = request.headers.get("authorization")
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null
  const tokenFromQuery = request.nextUrl.searchParams.get("token")
  const providedToken = tokenFromHeader || tokenFromQuery

  if (providedToken !== expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  const log: string[] = []
  const forceRecalc = request.nextUrl.searchParams.get("force") === "true"

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
    // ÉTAPE 2 — Équipes
    // ============================================
    const apiTeams = await fetchTeams()
    let teamsUpserted = 0
    for (const apiTeam of apiTeams) {
      const team = await prisma.team.upsert({
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
      })

      // Lien SeasonTeam (idempotent)
      await prisma.seasonTeam.upsert({
        where: { seasonId_teamId: { seasonId: season.id, teamId: team.id } },
        create: { seasonId: season.id, teamId: team.id },
        update: {},
      })

      teamsUpserted++
    }
    log.push(`✓ ${teamsUpserted} équipes synchronisées`)

    // ============================================
    // ÉTAPE 3 — Matchs + Matchdays
    // ============================================
    const apiMatches = await fetchMatches()
    const allTeams = await prisma.team.findMany()
    const teamIdByExternalId = new Map(allTeams.map((t) => [t.externalId, t.id]))

    // OPTIM : récupère tous les matchs existants en UNE seule query
    // pour détecter les transitions vers FINISHED (déclencheur points plus tard)
    const existingMatches = await prisma.match.findMany({
      select: { externalId: true, status: true },
    })
    const statusByExternalId = new Map(
      existingMatches.map((m) => [m.externalId, m.status])
    )

    // Groupe par journée pour upsert les Matchdays d'abord
    const matchesByMatchday = new Map<number, typeof apiMatches>()
    for (const m of apiMatches) {
      const list = matchesByMatchday.get(m.matchday) ?? []
      list.push(m)
      matchesByMatchday.set(m.matchday, list)
    }

    let matchdaysUpserted = 0
    let matchesUpserted = 0
    let matchesNewlyFinished = 0
    // IDs des matchs qui viennent de passer en FINISHED — pour recalcul ciblé
    const newlyFinishedMatchIds: string[] = []

    for (const [matchdayNumber, mdMatches] of matchesByMatchday) {
      const sortedKickoffs = mdMatches
        .map((m) => new Date(m.utcDate))
        .sort((a, b) => a.getTime() - b.getTime())
      const startDate = sortedKickoffs[0]
      const endDate = sortedKickoffs[sortedKickoffs.length - 1]
      const mdStatus = deriveMatchdayStatus(
        mdMatches.map((m) => ({
          status: mapMatchStatus(m.status),
          kickoffAt: new Date(m.utcDate),
        }))
      )

      const matchday = await prisma.matchday.upsert({
        where: {
          seasonId_number: { seasonId: season.id, number: matchdayNumber },
        },
        create: {
          seasonId: season.id,
          number: matchdayNumber,
          status: mdStatus,
          startDate,
          endDate,
        },
        update: {
          status: mdStatus,
          startDate,
          endDate,
        },
      })
      matchdaysUpserted++

      for (const apiMatch of mdMatches) {
        const homeTeamId = teamIdByExternalId.get(apiMatch.homeTeam.id)
        const awayTeamId = teamIdByExternalId.get(apiMatch.awayTeam.id)
        if (!homeTeamId || !awayTeamId) {
          continue
        }

        const newStatus = mapMatchStatus(apiMatch.status)

        // Détecte les matchs qui viennent de passer en FINISHED
        const previousStatus = statusByExternalId.get(apiMatch.id)
        const justFinished =
          previousStatus &&
          previousStatus !== "FINISHED" &&
          newStatus === "FINISHED"
        if (justFinished) {
          matchesNewlyFinished++
        }

        const upserted = await prisma.match.upsert({
          where: { externalId: apiMatch.id },
          create: {
            externalId: apiMatch.id,
            matchdayId: matchday.id,
            homeTeamId,
            awayTeamId,
            kickoffAt: new Date(apiMatch.utcDate),
            status: newStatus,
            homeScore: apiMatch.score.fullTime.home,
            awayScore: apiMatch.score.fullTime.away,
          },
          update: {
            matchdayId: matchday.id,
            homeTeamId,
            awayTeamId,
            kickoffAt: new Date(apiMatch.utcDate),
            status: newStatus,
            homeScore: apiMatch.score.fullTime.home,
            awayScore: apiMatch.score.fullTime.away,
          },
        })
        if (justFinished) {
          newlyFinishedMatchIds.push(upserted.id)
        }
        matchesUpserted++
      }
    }
// ============================================
// ÉTAPE 5 — Top buteurs
// À AJOUTER DANS app/api/sync-matches/route.ts
// Juste avant `const duration = Date.now() - startTime`
//
// N'oublie pas d'ajouter fetchScorers à la liste des imports en haut :
//   import { ..., fetchScorers } from "@/lib/football-data"
// ============================================

    // Récupérer le top 15 buteurs
    const apiScorers = await fetchScorers(15)
    let scorersUpserted = 0

    for (let i = 0; i < apiScorers.length; i++) {
      const apiScorer = apiScorers[i]
      const teamId = teamIdByExternalId.get(apiScorer.team.id)
      if (!teamId) continue

      await prisma.scorer.upsert({
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
      scorersUpserted++
    }
    log.push(`✓ ${scorersUpserted} buteurs synchronisés`)
    log.push(
      `✓ ${matchdaysUpserted} journées + ${matchesUpserted} matchs synchronisés (${matchesNewlyFinished} nouveaux terminés)`
    )

// ============================================
    // ÉTAPE 6 — Recalcul des points
    // ============================================
    // - Par défaut (incrémental) : on recalcule UNIQUEMENT les pronos sur les
    //   matchs qui viennent de passer en FINISHED dans ce tick de cron.
    // - Avec ?force=true : recalcul total de tous les pronos FINISHED.
    //   À utiliser en cas de correction de score tardive par la FFF.
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
    return NextResponse.json({
      ok: true,
      duration: `${duration}ms`,
      log,
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        log,
      },
      { status: 500 }
    )
  }
}

