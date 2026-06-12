import Link from "next/link"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr"
import type { DashboardMatch, CurrentStage } from "@/lib/dashboard-data"

type UpcomingMatchesCardProps = {
  matches: DashboardMatch[]
  currentStage: CurrentStage
}

export function UpcomingMatchesCard({ matches, currentStage }: UpcomingMatchesCardProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
            {currentStage.number
              ? `Journée ${currentStage.number}`
              : "À venir"}
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

      <div>
        {currentStage.phase === "ongoing" ? (
          <p className="text-sm text-text-muted text-center py-4">
            Match en cours. Pronos fermés.
          </p>
        ) : currentStage.phase === "post" ? (
          <p className="text-sm text-text-muted text-center py-4">
            Saison terminée
          </p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            Aucun match à pronostiquer pour l&apos;instant
          </p>
        ) : (
          matches.map((match) => {
            const hasPrediction =
              match.myHomePrediction !== null &&
              match.myAwayPrediction !== null
            return (
              <div
                key={match.id}
                className="flex items-center gap-3 border-b border-white/5 last:border-b-0 space-x-3 min-h-[55px]"
              >
                <div className="text-xs text-text-muted shrink-0 hidden sm:block text-left">
                  <p>{match.kickoffDate}</p>
                  <p className="text-text-secondary font-medium">
                    {match.kickoffTime}
                  </p>
                </div>
                <div className="flex-1 items-center gap-3 min-w-0">
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
    </>
  )
}