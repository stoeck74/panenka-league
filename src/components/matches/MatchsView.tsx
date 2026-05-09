"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { gsap } from "gsap"
import { Lightning, ClockCountdown } from "@phosphor-icons/react"
import { MatchCard } from "./MatchCard"
import { getMatchesByMatchday, type FakeMatchDetailed, type FakeMatchday } from "@/lib/fake-data/matches"

type MatchsViewProps = {
  matches: FakeMatchDetailed[]
  matchdays: FakeMatchday[]
  currentMatchday: number
}

const MAX_BANCOS = 2

export function MatchsView({
  matches,
  matchdays,
  currentMatchday,
}: MatchsViewProps) {
  const [selectedMatchday, setSelectedMatchday] = useState(currentMatchday)
// Type de la journée sélectionnée
type MatchdayStatus = "past" | "current" | "future"

const selectedMatchdayInfo = matchdays.find((md) => md.number === selectedMatchday)
const matchdayStatus: MatchdayStatus = (selectedMatchdayInfo?.status as MatchdayStatus) ?? "future"

// Matchs de la journée sélectionnée (dynamique)
const displayedMatches = useMemo(
  () => getMatchesByMatchday(selectedMatchday),
  [selectedMatchday]
)
  // ============================================
  // STATE GLOBAL DES PRONOS ET BANCOS
  // ============================================
  // On stocke les bancos dans un Set d'IDs (super performant pour add/remove/has)
const [bancoIds, setBancoIds] = useState<Set<string>>(new Set())
const [predictions, setPredictions] = useState<Map<string, { home: number | null; away: number | null }>>(new Map())

// Quand la journée change, on resync depuis les fake data de cette journée
useEffect(() => {
  const newBancoIds = new Set<string>()
  const newPredictions = new Map<string, { home: number | null; away: number | null }>()

  displayedMatches.forEach((m) => {
    if (m.isBanco) newBancoIds.add(m.id)
    newPredictions.set(m.id, {
      home: m.myHomePrediction ?? null,
      away: m.myAwayPrediction ?? null,
    })
  })

  setBancoIds(newBancoIds)
  setPredictions(newPredictions)
}, [displayedMatches])

  // Refs pour animations GSAP
  const headerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  // ============================================
  // STATS DE LA JOURNÉE — RÉACTIVES
  // ============================================
const stats = useMemo(() => {
  const total = displayedMatches.length
  let predictionsMade = 0
  predictions.forEach((p) => {
    if (p.home !== null && p.away !== null) predictionsMade++
  })
  return {
    total,
    predictionsMade,
    bancosUsed: bancoIds.size,
    maxBancos: MAX_BANCOS,
  }
}, [predictions, bancoIds, displayedMatches])

  // ============================================
  // HANDLERS — Modification du state global
  // ============================================
  const handlePredictionChange = (
    matchId: string,
    home: number | null,
    away: number | null
  ) => {
    setPredictions((prev) => {
      const next = new Map(prev)
      next.set(matchId, { home, away })
      return next
    })
  }

  const handleBancoToggle = (matchId: string) => {
    setBancoIds((prev) => {
      const next = new Set(prev)
      if (next.has(matchId)) {
        next.delete(matchId)
      } else {
        // Bloque si déjà 2 bancos
        if (next.size >= MAX_BANCOS) {
          return prev // Pas de changement
        }
        next.add(matchId)
      }
      return next
    })
  }

  // ============================================
  // ANIMATION GSAP — Entrée stagger
  // ============================================
  useEffect(() => {
    const header = headerRef.current
    const tabs = tabsRef.current
    const cards = cardsRef.current

    if (!header || !tabs || !cards) return

    const elements = [header, tabs, ...cards.children]

    gsap.set(elements, { opacity: 0, y: 24 })

    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: "power3.out",
      delay: 0.1,
    })
  }, [selectedMatchday])

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">

        {/* HEADER */}
        <header ref={headerRef} className="mb-8">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Pronostics
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                Journée <span className="text-accent">{selectedMatchday}</span>
              </h1>
              <p className="text-text-secondary mt-1">
                Compose tes pronos avant le coup d&apos;envoi
              </p>
            </div>

            {/* Stats à droite */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
                  Pronos
                </p>
                <p className="text-2xl font-black text-text-primary">
                  {stats.predictionsMade}
                  <span className="text-text-muted text-base font-normal ml-1">
                    / {stats.total}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1">
                  <Lightning size={12} weight="fill" />
                  Bancos
                </p>
                <p className="text-2xl font-black text-accent">
                  {stats.bancosUsed}
                  <span className="text-text-muted text-base font-normal ml-1">
                    / {stats.maxBancos}
                  </span>
                </p>
              </div>

              <div className="hidden lg:block">
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1">
                  <ClockCountdown size={12} weight="bold" />
                  Coup d&apos;envoi
                </p>
                <p className="text-2xl font-black text-text-primary tabular-nums">
                  2j 14h
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* SÉLECTEUR DE JOURNÉE */}
        <div ref={tabsRef} className="mb-8 -mx-4 md:mx-0">
          <div className="flex gap-2 overflow-x-auto pb-2 px-4 md:px-0 scrollbar-hide">
            {matchdays.map((md) => (
              <button
                key={md.number}
                type="button"
                onClick={() => setSelectedMatchday(md.number)}
                className={`
                  shrink-0 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all
                  ${selectedMatchday === md.number
                    ? "bg-accent text-bg"
                    : "bg-white/[0.03] border border-white/10 text-text-secondary hover:bg-white/[0.06] hover:text-text-primary"
                  }
                `}
              >
                Journée {md.number}
                {md.status === "current" && selectedMatchday !== md.number && (
                  <span className="ml-2 inline-block w-1.5 h-1.5 bg-accent rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* LISTE DES MATCHS */}
<div
  ref={cardsRef}
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
>
  {displayedMatches.length === 0 ? (
    <div className="col-span-full rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-12 text-center text-text-muted">
      Aucun match disponible pour cette journée
    </div>
  ) : (
    displayedMatches.map((match) => {
      const prediction = predictions.get(match.id) ?? { home: null, away: null }
      return (
        <MatchCard
          key={match.id}
          match={match}
          homePrediction={prediction.home}
          awayPrediction={prediction.away}
          isBanco={bancoIds.has(match.id)}
          bancoLimitReached={bancoIds.size >= MAX_BANCOS && !bancoIds.has(match.id)}
          matchdayStatus={matchdayStatus}
          onPredictionChange={handlePredictionChange}
          onBancoToggle={handleBancoToggle}
        />
      )
    })
  )}
</div>

      </div>
    </div>
  )
}