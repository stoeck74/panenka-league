import { auth } from "@/../auth"
import { ArrowRight, Lightning } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { DashboardChart } from "@/components/dashboard/DashboardChart"
import { PositionPop } from "@/components/dashboard/PositionPop"
import { HeroProgressBar } from "@/components/dashboard/HeroProgressBar"
import { SuccessRateCard } from "@/components/dashboard/SuccessRateCard"
import { ExactScoresCard } from "@/components/dashboard/ExactScoresCard"
import { GoldenBootCardStub } from "@/components/dashboard/GoldenBootCardStub"
import { PointsLastStageCard } from "@/components/dashboard/PointsLastStageCard"

import { getTopTeamForUser } from "@/lib/dashboard-data"
import { TopTeamCard } from "@/components/dashboard/TopTeamCard"

import { getWorstTeamForUser } from "@/lib/dashboard-data"
import { WorstTeamCard } from "@/components/dashboard/WorstTeamCard"

import { getRankingTrend } from "@/lib/dashboard-data"
import { RankingTrendCard } from "@/components/dashboard/RankingTrendCard"

import {
  getCurrentStage,
  getUserStats,
  getUserPosition,
  getUpcomingMatches,
  getLeaderboardTop,
  getLastFinishedMatchdayResults,
  getPointsLastStage,
  getChartData,
} from "@/lib/dashboard-data"


export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null
  const userId = session.user.id

  // Toutes les data en parallèle (gain de perf énorme)
  const [
    currentStage,
    stats,
    position,
    upcomingMatches,
    leaderboardTop,
    lastResultsData,
    pointsLastStage,
    chartData,
    topTeam,
    worstTeam,
    rankingTrend,
  ] = await Promise.all([
    getCurrentStage(userId),
    getUserStats(userId),
    getUserPosition(userId),
    getUpcomingMatches(9, userId),
    getLeaderboardTop(userId, 4),
    getLastFinishedMatchdayResults(userId),
    getPointsLastStage(userId),
    getChartData(userId),
    getTopTeamForUser(userId),
    getWorstTeamForUser(userId),
    getRankingTrend(userId),

  ])

  // Adapte le libellé du bouton Hero selon le statut
  // - UPCOMING : "Pronostiquer" (action possible)
  // - ACTIVE : "Voir les matchs" (lock, on consulte)
  // - null (saison terminée) : pas affiché

  const heroCtaLabel =
    currentStage.phase === "ongoing" ? "Voir les matchs" :
    currentStage.phase === "post" ? null :  // pas de CTA en post-saison
    "Pronostiquer"

  // Eyebrow contextuel pour le hero
  const heroEyebrow =
    currentStage.phase === "pre" ? "Saison à venir" :
    currentStage.phase === "ongoing" ? "Match en cours" :
    currentStage.phase === "post" ? "Saison terminée" :
    "Prochaine journée"

  return (
    <div className="relative bg-dashboard h-full p-4 md:p-6 lg:p-8 overflow-hidden">
      <div className="max-w-full mx-auto">

        {/* Halos décoratifs */}
        <div className="absolute top-0 right-0 w-[1000px] h-[800px] bg-accent/25 rounded-full blur-[300px] pointer-events-none -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[1500px] h-[1000px] bg-accent/15 rounded-full blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />

        {/* Header */}
        <header className="mb-8 relative">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Tableau de bord
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            Bonjour <span className="text-accent">{session.user.username}</span>
          </h1>
          <p className="text-text-secondary mt-1">
            {currentStage.label}
            {currentStage.startDate && ` · ${currentStage.startDate}`}
          </p>
        </header>

        {/* ============================================
            LIGNE 1 — Hero (journée en cours) + Position
            ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 relative">

          {/* HERO CARD */}
          <div className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-black/15 border border-white/10 backdrop-blur-sm p-8 flex flex-col justify-between gap-6">
        <div className="absolute bottom-1/2 left-0 h-full w-1/2 bg-linear-to-br from-accent/50 to-lime-500/10  blur-3xl pointer-events-none isolate" />

            {/* TITRE */}
            <div className="relative">
              <p className="text-xs uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
                <Lightning size={14} weight="fill" />
                {heroEyebrow}
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-text-primary leading-tight mb-2">
                {currentStage.label}
              </h2>
              {currentStage.startDate && (
                <p className="text-neutral-200 text-lg">
                  {currentStage.startDate} · coup d&apos;envoi {currentStage.startTime}
                </p>
              )}
            </div>



            {/* FOOTER — Progress bar + bouton */}
              {currentStage.number !== null && (
              <div className="relative flex flex-col sm:flex-row sm:items-end sm:gap-6 gap-4">
                {/* La barre n'a de sens que si pronos ouverts */}
                {(currentStage.phase === "pre" || currentStage.phase === "pronosticable") && (
                  <div className="flex-1">
                    <HeroProgressBar
                      progress={{
                        matchdayNumber: currentStage.number,
                        matchesCount: currentStage.matchesCount,
                        predictionsMade: currentStage.predictionsMade,
                      }}
                    />
                  </div>
                )}
                {heroCtaLabel && (
                  <Link
                    href="/matchs"
                    className="inline-flex items-center justify-center gap-2 bg-accent text-bg px-6 py-3 rounded-lg font-semibold hover:bg-accent-hover transition-colors group shrink-0"
                  >
                    {heroCtaLabel}
                    <ArrowRight size={18} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* CARD POSITION */}
          <div className="lg:col-span-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-300 to-lime-500 border border-lime-800/50 backdrop-blur-sm p-6 md:p-8 flex flex-col">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-lime-200/70 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-lime-600/80 rounded-full blur-3xl pointer-events-none" />

            <p className="relative text-xs uppercase tracking-widest text-neutral-900 mb-4">
              Ma position
            </p>
            <div className="relative flex-1 min-h-[200px]">
              <PositionPop
                position={position.position}
                totalPlayers={position.totalPlayers}
              />
            </div>
          </div>

        </div>

        {/* ============================================
            LIGNE 2 — Stats (Donut + Exacts) + Chart
            ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 relative items-stretch">

          <div className="lg:col-span-2 h-full">
            <SuccessRateCard
              goodResults={stats.goodResults + stats.exactScores}
              totalFinished={stats.finishedPredictions}
            />
          </div>

          <div className="lg:col-span-2 h-full">
            <ExactScoresCard
              exactScores={stats.exactScores}
              totalFinished={stats.finishedPredictions}
            />
          </div>

          <div className="lg:col-span-8 min-w-0 h-full">
            <DashboardChart data={chartData} />
          </div>

        </div>


          {/* ============================================
            LIGNE 3 — Matchs à pronostiquer + Top + Derniers résultats
            ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 relative">
            <div className="lg:col-span-4">
              <GoldenBootCardStub />
            </div>
        

          {/* MATCHS À PRONOSTIQUER */}
          <div className="lg:col-span-3 rounded-2xl bg-black/15 border border-white/10 backdrop-blur-xl p-6 md:p-8 overflow-hidden">
                      <div className="absolute -top-1/2 left-1/2 h-full w-full bg-linear-to-br from-accent/20 to-transparent rounded-full blur-3xl pointer-events-none isolate" />
          
            <div className="flex items-center justify-between mb-6">
              <div>
                    <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
                  {lastResultsData.matchdayNumber
                    ? `Journée ${lastResultsData.matchdayNumber}`
                    : "Aucun résultat"}
                </p>
                <h3 className="text-xl font-bold text-text-primary">
                  Matchs à pronostiquer
                </h3>
              </div>
              <Link
                href="/matchs"
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                Voir tout
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>

            <div className="">
              {currentStage.phase === "ongoing" ? (
                <p className="text-sm text-text-muted text-center py-4">
                  Match en cours. Pronos fermés.
                </p>
              ) : currentStage.phase === "post" ? (
                <p className="text-sm text-text-muted text-center py-4">
                  Saison terminée
                </p>
              ) : upcomingMatches.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
                  Aucun match à pronostiquer pour l&apos;instant
                </p>
              ) : (
                upcomingMatches.map((match) => {
                  const hasPrediction =
                    match.myHomePrediction !== null &&
                    match.myAwayPrediction !== null
                  return (
                    <div
                      key={match.id}
                      className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-b-0 space-x-3"
                    >
                     <div className="text-xs text-text-muted shrink-0 hidden sm:block text-left">
                        <p>{match.kickoffDate}</p>
                        <p className="text-text-secondary font-medium">
                          {match.kickoffTime}
                        </p>
                      </div>
                      <div className="flex-1 items-center gap-3  min-w-0">
                        <span className="text-xs font-bold uppercase text-text-primary shrink-0 w-10">
                          {match.homeTeamName}
                        </span>
                        <span className="text-xs text-text-muted mx-4">vs</span>
                        <span className="text-xs font-bold uppercase text-text-primary shrink-0 w-10">
                          {match.awayTeamName}
                        </span>
                      </div>



                      <div className="text-xs shrink-0 w-20 text-right">
                        {hasPrediction ? (
                          <span className="text-accent font-bold tabular-nums">
                            {match.myHomePrediction}-{match.myAwayPrediction}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">À faire</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </div>

           {/* DERNIERS RÉSULTATS */}
          <div className="lg:col-span-3 rounded-2xl bg-black/15 border border-white/10 backdrop-blur-xl p-6 md:p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <div className=" w-full">
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
                  {currentStage.label}
                </p>
                <h3 className="text-xl font-bold text-text-primary flex items-baseline justify-between gap-2">
                  <span>
                    <span className="text-accent">(Tes) </span>Derniers résultats
                  </span>
                  <span className="text-xs font-normal uppercase tracking-widest text-accent">
                    pts
                  </span>
                </h3>
              </div>
              {pointsLastStage > 0 && (
                <div className="text-right">
                  <p className="text-xs text-text-muted">Récent</p>
                  <p className="text-xl font-bold text-accent">
                    +{pointsLastStage}
                  </p>
                </div>
              )}
            </div>

            <div className="">
              {lastResultsData.results.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
                  Aucun résultat pour l&apos;instant
                </p>
              ) : (
                lastResultsData.results.map((result) => (
                  <div
                    key={result.matchId}
                      className="flex items-center gap-3 py-4.5 border-b border-white/5 last:border-b-0 space-x-3 min-h-[44px]"                  >
                    {/* 1. NOM ÉQUIPE DOMICILE */}
                    <div className="flex-1 flex justify-end items-center pr-3 min-w-0">
                      <span className="text-xs font-bold uppercase text-neutral-200 truncate whitespace-nowrap">
                        {result.homeTeamName}
                      </span>
                    </div>

                    {/* 2. SCORE ou REPORTÉ */}
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-text-primary tabular-nums shrink-0 w-16">
                      {result.isPostponed ? (
                        <span className="text-text-muted italic uppercase text-[10px] tracking-wider">
                          Reporté
                        </span>
                      ) : (
                        <>
                          <span>{result.homeScore}</span>
                          <span className="text-text-muted">-</span>
                          <span>{result.awayScore}</span>
                        </>
                      )}
                    </div>

                    {/* 3. NOM ÉQUIPE EXTÉRIEUR */}
                    <div className="flex-1 flex justify-start items-center pl-3 gap-1 min-w-0">
                      <span className="text-xs font-bold uppercase text-neutral-200 truncate whitespace-nowrap">
                        {result.awayTeamName}
                      </span>
                      {result.isBanco && (
                        <Lightning size={12} weight="fill" className="text-accent shrink-0" />
                      )}
                    </div>

                    {/* 4. POINTS */}
                     <div
                      className={`
                        font-bold w-12 text-right shrink-0 tabular-nums
                        ${result.myPoints > 0
                          ? "text-accent"
                          : result.myPoints < 0
                            ? "text-red-400"
                            : "text-text-muted"
                        }
                      `}
                    >
                      {result.myPoints > 0 ? `+${result.myPoints}` : result.myPoints}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="lg:col-span-2 rounded-2xl bg-black/15 border border-white/10 backdrop-blur-xl p-6 md:p-8 h-full">
          <PointsLastStageCard
            points={pointsLastStage}
            matchdayNumber={lastResultsData.matchdayNumber}
          />
        </div>

      </div>
         {/* ============================================
            LIGNE 4 
            ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 relative">  

        {/* TOP CLASSEMENT */}
          <div className="lg:col-span-3 rounded-2xl bg-black/15 border border-white/10 backdrop-blur-sm p-6 md:p-8 overflow-hidden">
                  <div className="absolute top-0 left-0 h-1/4 w-1/2 bg-linear-to-br from-accent/75 to-lime-500/10  blur-3xl pointer-events-none isolate" />

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
                  Classement
                </p>
                <h3 className="text-xl font-bold text-text-primary">
                  Top de la League
                </h3>
              </div>
              <Link
                href="/classement"
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                Voir tout
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>

            <div className="space-y-2">
              {leaderboardTop.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
                  Aucun joueur encore
                </p>
              ) : (
                leaderboardTop.map((player) => {
                  const avatarStyle = player.avatarStyle ?? "toon-head"
                  const avatarSeed = player.avatarSeed ?? player.username
                  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`

                  return (
                    <Link
                      key={`${player.position}-${player.username}`}
                      href={`/joueurs/${player.username}`}
                      className={`
                        flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors
                        ${player.isMe
                          ? "bg-accent/10 border border-accent/20"
                          : "hover:bg-white/[0.05]"
                        }
                      `}
                    >
                      <span className={`
                        text-sm font-bold w-6 shrink-0 tabular-nums
                        ${player.isMe ? "text-accent" : "text-text-muted"}
                      `}>
                        {player.position}.
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt={player.username}
                        className="w-8 h-8 rounded-full bg-accent/30 border border-white/10 shrink-0"
                      />
                      <span className={`
                        flex-1 text-sm font-medium truncate
                        ${player.isMe ? "text-text-primary" : "text-text-secondary"}
                      `}>
                        {player.username}
                      </span>
                      <span className={`
                        text-sm font-bold shrink-0 tabular-nums
                        ${player.isMe ? "text-accent" : "text-text-primary"}
                      `}>
                        {player.points}
                        <span className="text-text-muted text-xs font-normal ml-1">pts</span>
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>          

          <div className="lg:col-span-3 rounded-2xl bg-black/ border border-white/10 backdrop-blur-xl p-6 md:p-8 h-full overflow-hidden">
           <div className="absolute top-2/3 h-full w-full bg-linear-to-t from-accent to-transparent rounded-full blur-3xl pointer-events-none isolate" />
            <RankingTrendCard trend={rankingTrend} />
          </div>

          <div className="lg:col-span-3 rounded-2xl bg-black/15 border border-white/10 backdrop-blur-xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-2/3 h-full w-full bg-linear-to-t from-accent to-transparent rounded-full blur-3xl pointer-events-none isolate" />
              <TopTeamCard topTeam={topTeam} />

              </div>
              
          <div className="lg:col-span-3 rounded-2xl bg-black/ border border-white/10 backdrop-blur-xl p-6 md:p-8 h-full overflow-hidden">
           <div className="absolute top-2/3 h-full w-full bg-linear-to-t from-red-500 to-red-200/5 rounded-full blur-3xl pointer-events-none isolate" />
            <WorstTeamCard worstTeam={worstTeam} />
          </div>

   

       </div>

      </div>
    </div>


  )
}
