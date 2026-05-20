"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import type { ResultatsPageData, StandingEntry, FormResult } from "@/lib/resultats-data"

// ============================================
// RESULTATS VIEW
// Classement officiel L1 calculé depuis nos matchs.
// ============================================

type ResultatsViewProps = {
  data: ResultatsPageData
}

export function ResultatsView({ data }: ResultatsViewProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const header = headerRef.current
    const table = tableRef.current
    if (!header || !table) return

    const rows = Array.from(table.querySelectorAll("[data-row]")) as HTMLElement[]
    const elements = [header, ...rows]

    gsap.set(elements, { opacity: 0, y: 16 })
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.03,
      ease: "power3.out",
      delay: 0.1,
    })

    return () => {
      gsap.killTweensOf(elements)
    }
  }, [data.standings.length])

  return (
    <div className="p-4 md:p-6 lg:p-8">
        {/* HEADER */}
        <header ref={headerRef} className="mb-8">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            {data.seasonName}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            Résultats
          </h1>
          <p className="text-text-secondary mt-1">
            {data.lastPlayedMatchday !== null
              ? `Classement après la journée ${data.lastPlayedMatchday}`
              : "Aucune journée jouée pour le moment"}
          </p>
        </header>
      <div className="max-w-5xl mx-auto">

      

        {/* TABLE */}
        <div
          ref={tableRef}
          className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden"
        >
          {/* HEAD */}
          <div className="hidden md:grid grid-cols-[40px_1fr_repeat(7,40px)_60px_120px] gap-2 px-4 py-3 text-[10px] uppercase tracking-widest text-text-muted border-b border-white/5">
            <div className="text-center">#</div>
            <div>Équipe</div>
            <div className="text-center" title="Joués">J</div>
            <div className="text-center" title="Victoires">V</div>
            <div className="text-center" title="Nuls">N</div>
            <div className="text-center" title="Défaites">D</div>
            <div className="text-center" title="Buts pour">BP</div>
            <div className="text-center" title="Buts contre">BC</div>
            <div className="text-center" title="Différence">+/-</div>
            <div className="text-center font-bold">Pts</div>
            <div className="text-center" title="Forme (5 derniers)">Forme</div>
          </div>

          {/* ROWS */}
          <div className="divide-y divide-white/5">
            {data.standings.map((entry) => (
              <StandingRow key={entry.teamId} entry={entry} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ============================================
// LIGNE — Desktop : grid à colonnes ; Mobile : layout simplifié
// ============================================
function StandingRow({ entry }: { entry: StandingEntry }) {
  const isPodium = entry.rank <= 3
  const isRelegation = entry.rank >= 16 // L1 : 16-17-18 = barrage + relégation

  return (
    <div
      data-row
      className={`
        transition-colors
        ${entry.isFavorite ? "bg-accent/[0.08]" : "hover:bg-white/[0.02]"}
      `}
    >
      {/* DESKTOP : grid */}
      <div className="hidden md:grid grid-cols-[40px_1fr_repeat(7,40px)_60px_120px] gap-2 px-4 py-3 items-center text-sm">
        {/* Rang */}
        <div className="text-center">
          <span
            className={`
              text-base font-black tabular-nums inline-flex items-center justify-center
              ${isPodium ? "text-accent" : isRelegation ? "text-red-400/70" : "text-text-muted"}
            `}
          >
            {entry.rank}
          </span>
        </div>

        {/* Équipe (logo + nom) */}
        <div className="flex items-center gap-3 min-w-0">
          {entry.crestUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.crestUrl}
              alt={entry.tla}
              className="w-6 h-6 object-contain shrink-0"
            />
          )}
          <span
            className={`
              font-semibold truncate
              ${entry.isFavorite ? "text-accent" : "text-text-primary"}
            `}
          >
            {entry.shortName}
          </span>
        </div>

        {/* Stats */}
        <div className="text-center tabular-nums text-text-secondary">{entry.played}</div>
        <div className="text-center tabular-nums text-text-secondary">{entry.wins}</div>
        <div className="text-center tabular-nums text-text-secondary">{entry.draws}</div>
        <div className="text-center tabular-nums text-text-secondary">{entry.losses}</div>
        <div className="text-center tabular-nums text-text-secondary">{entry.goalsFor}</div>
        <div className="text-center tabular-nums text-text-secondary">{entry.goalsAgainst}</div>
        <div
          className={`
            text-center tabular-nums font-medium
            ${entry.goalDiff > 0 ? "text-text-primary" : entry.goalDiff < 0 ? "text-text-muted" : "text-text-secondary"}
          `}
        >
          {entry.goalDiff > 0 ? `+${entry.goalDiff}` : entry.goalDiff}
        </div>

        {/* Points */}
        <div className="text-center">
          <span className="text-lg font-black tabular-nums text-text-primary">
            {entry.points}
          </span>
        </div>

        {/* Forme */}
        <div className="flex items-center justify-center gap-1">
          {entry.form.length === 0 ? (
            <span className="text-text-muted text-xs">—</span>
          ) : (
            entry.form.map((r, i) => <FormPip key={i} result={r} />)
          )}
        </div>
      </div>

      {/* MOBILE : layout condensé */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3">
        <span
          className={`
            text-base font-black tabular-nums w-6 shrink-0 text-center
            ${isPodium ? "text-accent" : isRelegation ? "text-red-400/70" : "text-text-muted"}
          `}
        >
          {entry.rank}
        </span>

        {entry.crestUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.crestUrl}
            alt={entry.tla}
            className="w-6 h-6 object-contain shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <p
            className={`
              text-sm font-semibold truncate
              ${entry.isFavorite ? "text-accent" : "text-text-primary"}
            `}
          >
            {entry.shortName}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            {entry.played} J · {entry.wins}V {entry.draws}N {entry.losses}D ·{" "}
            {entry.goalDiff > 0 ? `+${entry.goalDiff}` : entry.goalDiff}
          </p>
        </div>

        {/* Forme + Points sur mobile */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-base font-black tabular-nums text-text-primary leading-none">
            {entry.points}
            <span className="text-[10px] font-normal text-text-muted ml-1">pts</span>
          </span>
          {entry.form.length > 0 && (
            <div className="flex gap-0.5">
              {entry.form.map((r, i) => (
                <FormPip key={i} result={r} small />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// PIP de forme (W/D/L)
// ============================================
function FormPip({ result, small = false }: { result: FormResult; small?: boolean }) {
  const size = small ? "w-3 h-3 text-[8px]" : "w-5 h-5 text-[10px]"
  const colors =
    result === "W"
      ? "bg-accent/80 text-bg"
      : result === "D"
        ? "bg-white/15 text-text-secondary"
        : "bg-red-500/70 text-white"

  return (
    <span
      className={`
        ${size} ${colors}
        rounded-full flex items-center justify-center font-bold tabular-nums
      `}
      title={result === "W" ? "Victoire" : result === "D" ? "Nul" : "Défaite"}
    >
      {result}
    </span>
  )
}