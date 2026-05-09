import { auth } from "@/../auth"
import {
  fakeUser,
  fakeNextMatchday,
  fakeLastMatchday,
  fakeUpcomingMatches,
  fakeRanking,
  fakeRecentResults,
} from "@/lib/fake-data/dashboard"
import {
  Lightning,
  ArrowRight,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { DashboardChart } from "@/components/dashboard/DashboardChart"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

 return (
<div className="relative bg-dashboard h-full p-4 md:p-6 lg:p-8 overflow-hidden">
    <div className="max-w-[1400px] mx-auto">

    {/* ============================================
        HALOS DÉCORATIFS — Ambiance chartreuse
        ============================================ */}
    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />
    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/8 rounded-full blur-[140px] pointer-events-none translate-x-1/3 translate-y-1/3" />

    {/* ============================================
        HEADER DE PAGE
        ============================================ */}
    <header className="mb-8 relative">
      <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
        Tableau de bord
      </p>
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
        Bonjour <span className="text-accent">{session.user.username}</span>
      </h1>
      <p className="text-text-secondary mt-1">
        Journée {fakeNextMatchday.number} · {fakeNextMatchday.startDate}
      </p>
    </header>

    {/* ============================================
        LIGNE 1 — Hero + Position
        ============================================ */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 relative">

      {/* HERO CARD — Prochaine journée */}
      <div className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-8 min-h-[260px] flex flex-col justify-between">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
            <Lightning size={14} weight="fill" />
            Prochaine journée
          </p>
          <h2 className="text-5xl md:text-6xl font-black text-text-primary leading-none mb-2">
            J{fakeNextMatchday.number}
          </h2>
          <p className="text-text-secondary text-lg">
            {fakeNextMatchday.startDate} · coup d'envoi {fakeNextMatchday.startTime}
          </p>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-6">
          <div>
            <p className="text-xs text-text-muted mb-1">Pronostics</p>
            <p className="text-2xl font-bold text-text-primary">
              {fakeNextMatchday.predictionsMade}
              <span className="text-text-muted text-lg font-normal">
                {" / "}{fakeNextMatchday.matchesCount} matchs
              </span>
            </p>
          </div>
          <Link
            href="/matchs"
            className="inline-flex items-center justify-center gap-2 bg-accent text-bg px-6 py-3 rounded-lg font-semibold hover:bg-accent-hover transition-colors group"
          >
            Pronostiquer
            <ArrowRight size={18} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* CARD POSITION */}
      <div className="lg:col-span-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-8 flex flex-col justify-between min-h-[260px]">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted mb-3">
            Ma position
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-black text-text-primary leading-none">
              {fakeUser.position}
            </span>
            <span className="text-2xl text-text-muted font-bold">e</span>
          </div>
          <p className="text-sm text-text-secondary mt-2">
            sur {fakeUser.totalPlayers} joueurs
          </p>
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted mb-1">Total points</p>
              <p className="text-2xl font-bold text-text-primary">
                {fakeUser.totalPoints}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-accent text-sm font-semibold">
              <TrendUp size={16} weight="bold" />
              +{fakeUser.pointsLastMatchday}
            </div>
          </div>
        </div>
      </div>

    </div>

    {/* ============================================
        LIGNE 2 — Graph + Stats (Performance)
        ============================================ */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 relative">

      {/* GRAPH */}
      <div className="lg:col-span-6 min-w-0">
        <DashboardChart />
      </div>

      {/* MES STATS — Compact en colonne */}
{/* MES STATS — Grid 2x2 */}
<div className="lg:col-span-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 md:p-8">
  <div className="mb-6">
    <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
      Saison en cours
    </p>
    <h3 className="text-xl font-bold text-text-primary">
      Mes statistiques
    </h3>
  </div>

  <div className="grid grid-cols-2 gap-3">
    <div className="rounded-xl bg-black/20 border border-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
        Total points
      </p>
      <p className="text-3xl font-black text-text-primary">
        {fakeUser.totalPoints}
      </p>
    </div>

    <div className="rounded-xl bg-black/20 border border-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
        Réussite
      </p>
      <p className="text-3xl font-black text-accent">
        {fakeUser.successRate}<span className="text-xl">%</span>
      </p>
    </div>

    <div className="rounded-xl bg-black/20 border border-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
        Scores exacts
      </p>
      <p className="text-3xl font-black text-text-primary">
        {fakeUser.exactScores}
      </p>
    </div>

    <div className="rounded-xl bg-black/20 border border-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
        Bons résultats
      </p>
      <p className="text-3xl font-black text-text-primary">
        {fakeUser.goodResults}
      </p>
    </div>
  </div>
</div>

    </div>

    {/* ============================================
        LIGNE 3 — Matchs à pronostiquer + Top classement (Compétition)
        ============================================ */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 relative">
      {/* MATCHS À PRONOSTIQUER */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
              À venir
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

        <div className="space-y-3">
          {fakeUpcomingMatches.slice(0, 4).map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={match.homeTeam.crest}
                  alt={match.homeTeam.shortName}
                  className="w-7 h-7 object-contain shrink-0"
                />
                <span className="text-sm font-medium text-text-primary truncate">
                  {match.homeTeam.shortName}
                </span>
              </div>

              <div className="px-3 text-xs text-text-muted">vs</div>

              <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                <span className="text-sm font-medium text-text-primary truncate text-right">
                  {match.awayTeam.shortName}
                </span>
                <img
                  src={match.awayTeam.crest}
                  alt={match.awayTeam.shortName}
                  className="w-7 h-7 object-contain shrink-0"
                />
              </div>

              <div className="ml-4 text-xs text-text-muted text-right shrink-0 hidden sm:block">
                <p>{match.date.split(" ")[0]}</p>
                <p className="text-text-secondary font-medium">{match.kickoff}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP CLASSEMENT */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
              Classement
            </p>
            <h3 className="text-xl font-bold text-text-primary">
              Top de la ligue
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
          {fakeRanking.map((player) => (
            <div
              key={player.position}
              className={`
                flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors
                ${player.isCurrentUser
                  ? "bg-accent/10 border border-accent/20"
                  : "hover:bg-white/[0.02]"
                }
              `}
            >
              <span className={`
                text-sm font-bold w-6 shrink-0
                ${player.isCurrentUser ? "text-accent" : "text-text-muted"}
              `}>
                {player.position}.
              </span>

              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold uppercase text-text-secondary">
                  {player.username[0]}
                </span>
              </div>

              <span className={`
                flex-1 text-sm font-medium truncate
                ${player.isCurrentUser ? "text-text-primary" : "text-text-secondary"}
              `}>
                {player.username}
                {player.isCurrentUser && (
                  <span className="text-accent ml-2 text-xs">●</span>
                )}
              </span>

              <span className={`
                text-sm font-bold shrink-0
                ${player.isCurrentUser ? "text-accent" : "text-text-primary"}
              `}>
                {player.points}
                <span className="text-text-muted text-xs font-normal ml-1">pts</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 md:p-8 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
            Journée {fakeLastMatchday.number}
          </p>
          <h3 className="text-xl font-bold text-text-primary">
            Mes derniers résultats
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Cette journée</p>
          <p className="text-xl font-bold text-accent">
            +{fakeLastMatchday.pointsEarned}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {fakeRecentResults.map((result) => (
          <div
            key={result.id}
            className="flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src={result.homeTeam.crest}
                alt=""
                className="w-6 h-6 object-contain shrink-0"
              />
              <span className="text-sm font-medium text-text-primary">
                {result.homeScore}
              </span>
              <span className="text-text-muted">-</span>
              <span className="text-sm font-medium text-text-primary">
                {result.awayScore}
              </span>
              <img
                src={result.awayTeam.crest}
                alt=""
                className="w-6 h-6 object-contain shrink-0"
              />
              {result.isBanco && (
                <Lightning size={14} weight="fill" className="text-accent ml-1" />
              )}
            </div>

            <div className="text-xs text-text-muted">
              prono <span className="text-text-secondary font-medium">{result.myPrediction}</span>
            </div>

            <div className={`
              text-sm font-bold w-12 text-right shrink-0
              ${result.myPoints > 0 ? "text-accent" : "text-text-muted"}
            `}>
              {result.myPoints > 0 ? `+${result.myPoints}` : "0"}
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  </div>
</div>
)
}