"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { Lightning, Lock } from "@phosphor-icons/react"
import { ScoreInput } from "./ScoreInput"
import type { FakeMatchDetailed } from "@/lib/fake-data/matches"

type MatchdayStatus = "past" | "current" | "future"

type MatchCardProps = {
  match: FakeMatchDetailed
  homePrediction: number | null
  awayPrediction: number | null
  isBanco: boolean
  bancoLimitReached: boolean
  matchdayStatus: MatchdayStatus
  onPredictionChange: (matchId: string, home: number | null, away: number | null) => void
  onBancoToggle: (matchId: string) => void
}

export function MatchCard({
  match,
  homePrediction,
  awayPrediction,
  isBanco,
  bancoLimitReached,
  matchdayStatus,
  onPredictionChange,
  onBancoToggle,
}: MatchCardProps) {
  const rectRef = useRef<SVGRectElement>(null)

  // ============================================
  // ANIMATION TRACÉ BANCO
  // ============================================
  useEffect(() => {
    const rect = rectRef.current
    if (!rect) return

    const length = rect.getTotalLength()

    gsap.set(rect, {
      strokeDasharray: length,
      strokeDashoffset: length,
    })

    if (isBanco) {
      gsap.to(rect, {
        strokeDashoffset: 0,
        duration: 0.7,
        ease: "power2.inOut",
      })
    } else {
      gsap.to(rect, {
        strokeDashoffset: length,
        duration: 0.4,
        ease: "power2.in",
      })
    }
  }, [isBanco])

  // ============================================
  // HANDLERS
  // ============================================
  const handleHomeChange = (value: number) => {
    onPredictionChange(match.id, value, awayPrediction)
  }

  const handleAwayChange = (value: number) => {
    onPredictionChange(match.id, homePrediction, value)
  }

  // ============================================
  // LOGIQUE D'ÉTAT
  // ============================================
  // Lecture seule si :
  // - Journée passée (matchs déjà joués)
  // - Journée future (pas encore pronostiquable)
  // - Match individuel verrouillé (kickoff dépassé sur la journée courante)
  const isReadOnly = matchdayStatus !== "current" || match.status !== "scheduled"

  // Banco visible uniquement sur la journée courante
  const showBancoToggle = matchdayStatus === "current" && match.status === "scheduled"

  const bancoDisabled = bancoLimitReached && !isBanco
  const isFinished = match.status === "finished"

  return (
    <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">

      {/* SVG animation tracé banco */}
<svg
  className="absolute inset-0 w-full h-full pointer-events-none"
  style={{ zIndex: 1, overflow: "visible" }}
  preserveAspectRatio="none"
>
  <rect
    ref={rectRef}
    x="0"
    y="0"
    width="100%"
    height="100%"
    rx="16"
    ry="16"
    fill="none"
    stroke="#A8FF00"
    strokeWidth="2"
  />
</svg>

      <div className="relative p-5 md:p-6" style={{ zIndex: 2 }}>

        {/* Header : date + indicateur statut + toggle banco / points */}
<div className="flex items-center justify-between mb-5 h-8">
  <p className="text-xs uppercase tracking-widest text-text-muted">
    {match.kickoffDate} · {match.kickoffTime}
  </p>

          {/* Bouton banco — uniquement sur journée courante avec match scheduled */}
          {showBancoToggle && (
            <button
              type="button"
              onClick={() => onBancoToggle(match.id)}
              disabled={bancoDisabled}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all
                ${isBanco
                  ? "bg-accent text-bg"
                  : bancoDisabled
                    ? "bg-white/[0.02] text-text-muted/40 cursor-not-allowed"
                    : "bg-white/[0.03] text-text-muted hover:bg-white/[0.08] hover:text-accent cursor-pointer"
                }
              `}
              aria-label={isBanco ? "Désactiver banco" : "Activer banco"}
              title={
                bancoDisabled
                  ? "Maximum 2 bancos par journée"
                  : isBanco
                    ? "Banco activé"
                    : "Activer le banco (×2 points)"
              }
            >
              <Lightning size={16} weight={isBanco ? "fill" : "regular"} />
            </button>
          )}

          {/* Indicateur banco — sur match passé qui était banco */}
          {isFinished && match.isBanco && (
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Lightning size={14} weight="fill" className="text-accent" />
            </div>
          )}

          {/* Indicateur lecture seule — sur journée future */}
          {matchdayStatus === "future" && (
            <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center">
              <Lock size={14} weight="regular" className="text-text-muted" />
            </div>
          )}
        </div>

        {/* Équipe domicile */}
        <div className="flex items-center justify-between py-3 border-b border-white/5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={match.homeTeam.crest}
              alt={match.homeTeam.shortName}
              className="w-8 h-8 object-contain shrink-0"
            />
            <span className="text-base font-semibold text-text-primary truncate">
              <span className="hidden md:inline">{match.homeTeam.shortName}</span>
              <span className="md:hidden">{match.homeTeam.tla}</span>
            </span>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {/* Score réel pour matchs terminés */}
            {isFinished && match.homeScore !== undefined && (
              <span className="text-3xl md:text-4xl font-black leading-none tabular-nums text-text-primary">
                {match.homeScore}
              </span>
            )}
            {/* Input prono */}
            <ScoreInput
              value={homePrediction}
              onChange={handleHomeChange}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Équipe extérieur */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={match.awayTeam.crest}
              alt={match.awayTeam.shortName}
              className="w-8 h-8 object-contain shrink-0"
            />
            <span className="text-base font-semibold text-text-primary truncate">
              <span className="hidden md:inline">{match.awayTeam.shortName}</span>
              <span className="md:hidden">{match.awayTeam.tla}</span>
            </span>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {isFinished && match.awayScore !== undefined && (
              <span className="text-3xl md:text-4xl font-black leading-none tabular-nums text-text-primary">
                {match.awayScore}
              </span>
            )}
            <ScoreInput
              value={awayPrediction}
              onChange={handleAwayChange}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Footer points gagnés — pour matchs terminés */}
        {isFinished && match.myPoints !== undefined && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-text-muted">
              {homePrediction !== null && awayPrediction !== null
                ? "Mon prono"
                : "Pas de prono"}
            </p>
            <p
              className={`
                text-sm font-bold
                ${match.myPoints > 0 ? "text-accent" : "text-text-muted"}
              `}
            >
              {match.myPoints > 0 ? `+${match.myPoints}` : "0"} pts
            </p>
          </div>
        )}

      </div>
    </div>
  )
}