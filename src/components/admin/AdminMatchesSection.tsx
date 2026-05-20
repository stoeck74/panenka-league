"use client"

import { useState, useTransition } from "react"
import { updateMatchScore, resetMatch, recalculateMatchPoints } from "@/lib/actions/admin"

type AdminMatch = {
  id: string
  stage: string
  group: string | null
  status: string
  homeTeam: { name: string; tla: string } | null
  awayTeam: { name: string; tla: string } | null
  homeScore: number | null
  awayScore: number | null
  homePenalties: number | null
  awayPenalties: number | null
  kickoffAt: string
}

type AdminMatchesSectionProps = {
  matches: AdminMatch[]
}

type Filter = "all" | "scheduled" | "live" | "finished"

export function AdminMatchesSection({ matches }: AdminMatchesSectionProps) {
  const [filter, setFilter] = useState<Filter>("finished")

  const filtered = matches.filter((m) => {
    if (filter === "all") return true
    if (filter === "scheduled") return m.status === "SCHEDULED"
    if (filter === "live") return m.status === "LIVE"
    if (filter === "finished") return m.status === "FINISHED"
    return true
  })

  return (
    <section className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-text-primary">Matchs</h2>

        <div className="flex gap-1">
          {(["finished", "live", "scheduled", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium ${
                filter === f
                  ? "bg-accent text-bg"
                  : "bg-white/5 text-text-secondary hover:bg-white/10"
              }`}
            >
              {f === "all" ? "Tous" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-text-muted mb-3">
        {filtered.length} match{filtered.length > 1 ? "s" : ""}
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.map((match) => (
          <AdminMatchRow key={match.id} match={match} />
        ))}
      </div>
    </section>
  )
}

function AdminMatchRow({ match }: { match: AdminMatch }) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? "0")
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? "0")
  const [homePens, setHomePens] = useState(match.homePenalties?.toString() ?? "")
  const [awayPens, setAwayPens] = useState(match.awayPenalties?.toString() ?? "")

  const kickoffDate = new Date(match.kickoffAt).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

  const handleSave = () => {
    startTransition(async () => {
      const home = parseInt(homeScore, 10)
      const away = parseInt(awayScore, 10)
      const hPens = homePens ? parseInt(homePens, 10) : null
      const aPens = awayPens ? parseInt(awayPens, 10) : null

      if (isNaN(home) || isNaN(away)) {
        alert("Scores invalides")
        return
      }

      const result = await updateMatchScore(match.id, home, away, hPens, aPens)
      if (result.ok) {
        setEditing(false)
      } else {
        alert("Erreur")
      }
    })
  }

  const handleRecalc = () => {
    startTransition(async () => {
      const result = await recalculateMatchPoints(match.id)
      if (result.ok) {
        alert(`${result.updatedCount} pronos recalculés`)
      } else {
        alert(`Erreur: ${result.error}`)
      }
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      await resetMatch(match.id)
    })
  }

  const isKO = match.stage !== "GROUP"

  return (
    <div className="rounded-lg bg-black/30 border border-white/5 p-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Stage badge */}
        <span className="text-[10px] uppercase tracking-widest text-text-muted bg-white/5 px-2 py-1 rounded shrink-0">
          {match.stage}{match.group ? ` ${match.group}` : ""}
        </span>

        {/* Date */}
        <span className="text-xs text-text-muted shrink-0 w-32">
          {kickoffDate}
        </span>

        {/* Equipes + score */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-bold text-text-primary shrink-0 w-12">
            {match.homeTeam?.tla ?? "?"}
          </span>
          {editing ? (
            <>
              <input
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-12 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-text-primary text-center"
              />
              <span className="text-text-muted">-</span>
              <input
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-12 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-text-primary text-center"
              />
            </>
          ) : (
            <>
              <span className="text-sm font-bold text-text-primary tabular-nums w-6 text-center">
                {match.homeScore ?? "-"}
              </span>
              <span className="text-text-muted">-</span>
              <span className="text-sm font-bold text-text-primary tabular-nums w-6 text-center">
                {match.awayScore ?? "-"}
              </span>
            </>
          )}
          <span className="text-sm font-bold text-text-primary shrink-0 w-12">
            {match.awayTeam?.tla ?? "?"}
          </span>

          {/* TAB en KO */}
          {isKO && editing && (
            <span className="text-xs text-text-muted ml-2">
              TAB:
              <input
                type="number"
                value={homePens}
                onChange={(e) => setHomePens(e.target.value)}
                placeholder="-"
                className="w-10 ml-1 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-xs text-text-primary text-center"
              />
              -
              <input
                type="number"
                value={awayPens}
                onChange={(e) => setAwayPens(e.target.value)}
                placeholder="-"
                className="w-10 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-xs text-text-primary text-center"
              />
            </span>
          )}
          {isKO && !editing && (match.homePenalties !== null || match.awayPenalties !== null) && (
            <span className="text-xs text-text-muted ml-2">
              (TAB {match.homePenalties}-{match.awayPenalties})
            </span>
          )}
        </div>

        {/* Status */}
        <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded shrink-0 ${
          match.status === "FINISHED" ? "bg-green-500/20 text-green-400" :
          match.status === "LIVE" ? "bg-red-500/20 text-red-400" :
          "bg-white/5 text-text-muted"
        }`}>
          {match.status}
        </span>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={isPending} className="px-2 py-1 rounded bg-accent text-bg text-xs font-medium disabled:opacity-50">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="px-2 py-1 rounded bg-white/5 text-text-secondary text-xs">
                ✕
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="px-2 py-1 rounded bg-white/5 text-text-secondary text-xs hover:bg-white/10">
                Édit
              </button>
              {match.status === "FINISHED" && (
                <>
                  <button onClick={handleRecalc} disabled={isPending} className="px-2 py-1 rounded bg-white/5 text-text-secondary text-xs hover:bg-white/10 disabled:opacity-50">
                    ↻ Pts
                  </button>
                  <button onClick={handleReset} disabled={isPending} className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 disabled:opacity-50">
                    Reset
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}