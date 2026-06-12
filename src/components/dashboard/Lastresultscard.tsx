import { Lightning } from "@phosphor-icons/react/dist/ssr"
import type { LastResultsData } from "@/lib/dashboard-data"

type LastResultsCardProps = {
  lastResultsData: LastResultsData
  pointsLastStage: number
}

export function LastResultsCard({ lastResultsData, pointsLastStage }: LastResultsCardProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="w-full">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
            {lastResultsData.matchdayNumber
              ? `Journée ${lastResultsData.matchdayNumber}`
              : "Pas encore de résultats"}
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
          <div className="text-right shrink-0 ml-4">
            <p className="text-xs text-text-muted">Récent</p>
            <p className="text-xl font-bold text-accent">
              +{pointsLastStage}
            </p>
          </div>
        )}
      </div>

      <div>
        {lastResultsData.results.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            Aucun résultat pour l&apos;instant
          </p>
        ) : (
          lastResultsData.results.map((result) => (
            <div
              key={result.matchId}
              className="flex items-center gap-3 border-b border-white/5 last:border-b-0 space-x-3 min-h-[55px]"
            >
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
                  text-xs font-bold w-12 text-right shrink-0 tabular-nums
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
    </>
  )
}