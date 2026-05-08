"use client"

import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScoreInput } from "./ScoreInput"
import type { FakeMatchDetailed } from "@/lib/fake-data/matches"

type MatchCardProps = {
  match: FakeMatchDetailed
  onPredictionChange?: (matchId: string, home: number, away: number) => void
  onBancoToggle?: (matchId: string) => void
}

export function MatchCard({
  match,
  onPredictionChange,
  onBancoToggle,
}: MatchCardProps) {
  // State local — initialisé depuis les props
  const [homeScore, setHomeScore] = useState<number | null>(
    match.myHomePrediction ?? null
  )
  const [awayScore, setAwayScore] = useState<number | null>(
    match.myAwayPrediction ?? null
  )
  const [isBanco, setIsBanco] = useState(match.isBanco ?? false)

  // Refs pour l'animation SVG du contour banco
  const cardRef = useRef<HTMLDivElement>(null)
  const rectRef = useRef<SVGRectElement>(null)

  // ============================================
  // ANIMATION TRACÉ BANCO
  // ============================================
  useEffect(() => {
    const rect = rectRef.current
    if (!rect) return

    // Calculer le périmètre total du rectangle
    const length = rect.getTotalLength()

    // Setup initial : pas de trait visible
    gsap.set(rect, {
      strokeDasharray: length,
      strokeDashoffset: length,
    })

    if (isBanco) {
      // Trace le contour dans le sens horaire en 0.7s
      gsap.to(rect, {
        strokeDashoffset: 0,
        duration: 0.7,
        ease: "power2.inOut",
      })
    } else {
      // Fade out doux quand on désactive
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
    setHomeScore(value)
    if (awayScore !== null) {
      onPredictionChange?.(match.id, value, awayScore)
    }
  }

  const handleAwayChange = (value: number) => {
    setAwayScore(value)
    if (homeScore !== null) {
      onPredictionChange?.(match.id, homeScore, value)
    }
  }

  const handleBancoToggle = () => {
    setIsBanco(!isBanco)
    onBancoToggle?.(match.id)
  }

  // ============================================
  // RENDER
  // ============================================
  const isLocked = match.status !== "scheduled"

  return (
    <div
      ref={cardRef}
      className="relative rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden"
    >
      {/* SVG pour l'animation tracé banco — par-dessus la card */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
        preserveAspectRatio="none"
      >
        <rect
          ref={rectRef}
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="16"
          ry="16"
          fill="none"
          stroke="#A8FF00"
          strokeWidth="2"
        />
      </svg>

      {/* Contenu */}
      <div className="relative p-5 md:p-6" style={{ zIndex: 2 }}>

        {/* Header : date + toggle banco */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs uppercase tracking-widest text-text-muted">
            {match.kickoffDate} · {match.kickoffTime}
          </p>

          {!isLocked && (
            <button
              type="button"
              onClick={handleBancoToggle}
              className={`
                text-xs uppercase tracking-widest font-semibold transition-colors
                ${isBanco ? "text-accent" : "text-text-muted hover:text-text-secondary"}
              `}
            >
              {isBanco ? "Banco activé" : "Activer banco"}
            </button>
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
          <div className="shrink-0">
            <ScoreInput
              value={homeScore}
              onChange={handleHomeChange}
              disabled={isLocked}
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
          <div className="shrink-0">
            <ScoreInput
              value={awayScore}
              onChange={handleAwayChange}
              disabled={isLocked}
            />
          </div>
        </div>

      </div>
    </div>
  )
}