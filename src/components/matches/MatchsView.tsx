"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { gsap } from "gsap"
import { Lightning, ClockCountdown } from "@phosphor-icons/react"
import { MatchCard } from "./MatchCard"
import type { FakeMatchDetailed, FakeMatchday } from "@/lib/fake-data/matches"

type MatchsViewProps = {
  matches: FakeMatchDetailed[]
  matchdays: FakeMatchday[]
  currentMatchday: number
}

export function MatchsView({
  matches,
  matchdays,
  currentMatchday,
}: MatchsViewProps) {
  const [selectedMatchday, setSelectedMatchday] = useState(currentMatchday)

  // Refs pour animations GSAP
  const headerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  // ============================================
  // STATS DE LA JOURNÉE SÉLECTIONNÉE
  // ============================================
  const stats = useMemo(() => {
    const total = matches.length
    const predictionsMade = matches.filter(
      (m) => m.myHomePrediction !== null && m.myAwayPrediction !== null
    ).length
    const bancosUsed = matches.filter((m) => m.isBanco).length
    return { total, predictionsMade, bancosUsed }
  }, [matches])

  // ============================================
  // ANIMATION GSAP — Entrée stagger au load
  // ============================================
  useEffect(() => {
    const header = headerRef.current
    const tabs = tabsRef.current
    const cards = cardsRef.current

    if (!header || !tabs || !cards) return

    // Reset initial : tout invisible et légèrement décalé
    const elements = [header, tabs, ...cards.children]

    gsap.set(elements, { opacity: 0, y: 24 })

    // Animation stagger : un par un avec un léger décalage
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
    <div className="p-4 md:p-6 lg:p-8 bg-matches">
      <div className="max-w-[1400px] mx-auto">

        {/* ============================================
            HEADER DE PAGE
            ============================================ */}
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
              {/* Pronos faits */}
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

              {/* Bancos */}
              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1">
                  <Lightning size={12} weight="fill" />
                  Bancos
                </p>
                <p className="text-2xl font-black text-accent">
                  {stats.bancosUsed}
                  <span className="text-text-muted text-base font-normal ml-1">
                    / 2
                  </span>
                </p>
              </div>

              {/* Compte à rebours */}
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

        {/* ============================================
            SÉLECTEUR DE JOURNÉE — Pills scrollables
            ============================================ */}
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

        {/* ============================================
            LISTE DES MATCHS
            ============================================ */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

        >
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>

      </div>
    </div>
  )
}