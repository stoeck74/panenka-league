"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { SoccerBall } from "@phosphor-icons/react"
import type { ButeurEntry } from "@/lib/buteurs-data"

type ButeursViewProps = {
  buteurs: ButeurEntry[]
}

export function ButeursView({ buteurs }: ButeursViewProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const podiumRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const topThree = buteurs.slice(0, 3)
  const rest = buteurs.slice(3)
  const maxGoalsInRest = Math.max(...rest.map((b) => b.goals), 1)

  // ============================================
  // ANIMATIONS
  // ============================================
  useEffect(() => {
    // Header
    const header = headerRef.current
    if (header) {
      gsap.set(header, { opacity: 0, y: 24 })
      gsap.to(header, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" })
    }

    // Podium en cascade 3 → 2 → 1
    const podium = podiumRef.current
    if (podium) {
      const podiumThird = podium.querySelector("[data-podium='3']")
      const podiumSecond = podium.querySelector("[data-podium='2']")
      const podiumFirst = podium.querySelector("[data-podium='1']")

      const cards = [podiumFirst, podiumSecond, podiumThird].filter(Boolean)
      gsap.set(cards, { opacity: 0, y: 60 })

      const tl = gsap.timeline({ delay: 0.2 })
      if (podiumThird) {
        tl.to(podiumThird, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" })
      }
      if (podiumSecond) {
        tl.to(podiumSecond, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" }, "+=0.1")
      }
      if (podiumFirst) {
        tl.to(podiumFirst, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.4)" }, "+=0.1")
      }
    }

    // Liste avec barres animées
    const list = listRef.current
    if (list) {
      const rows = list.querySelectorAll("[data-row]")
      const bars: Element[] = []
      const labels: Element[] = []
      const targetWidths: string[] = []

      rows.forEach((row) => {
        const bar = row.querySelector("[data-bar]")
        const label = row.querySelector("[data-goals]")
        if (bar && label) {
          bars.push(bar)
          labels.push(label)
          targetWidths.push((row as HTMLElement).dataset.targetWidth ?? "0%")
        }
      })

      gsap.set(bars, { width: "0%" })
      gsap.set(labels, { opacity: 0 })

      bars.forEach((bar, i) => {
        gsap.to(bar, {
          width: targetWidths[i],
          duration: 0.7,
          ease: "power3.out",
          delay: 1.4,
        })
      })

      gsap.to(labels, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        delay: 2.1,
      })
    }

    return () => {
      gsap.killTweensOf("*")
    }
  }, [buteurs])

return (
    <div className="p-4 md:p-6 lg:p-8  w-full">
      {/* HEADER — full width, aligné à gauche */}
      <header ref={headerRef} className="mb-8">
        <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Ligue 1 — saison en cours
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
          Meilleurs buteurs
        </h1>
        <p className="text-text-secondary mt-1">
          Top {buteurs.length} de la saison
        </p>
      </header>

      {/* CONTENU — centré dans max-w */}
      <div className="max-w-[1400px] mx-auto space-y-6">

        {buteurs.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-12 text-center text-text-muted">
            Aucun buteur pour le moment.
            <br />
            <span className="text-xs">Lance une sync pour rapatrier les données.</span>
          </div>
        ) : (
          <>
            {/* PODIUM */}
            <div
              ref={podiumRef}
              className="grid grid-cols-3 gap-2 items-end"
            >
              {topThree[1] && <PodiumCard entry={topThree[1]} tier={2} />}
              {topThree[0] && <PodiumCard entry={topThree[0]} tier={1} isFirst />}
              {topThree[2] && <PodiumCard entry={topThree[2]} tier={3} />}
            </div>

            {/* LISTE 4 → 15 */}
            {rest.length > 0 && (
              <div
                ref={listRef}
                className="rounded-2xl bg-black/35 backdrop-blur-xl backdrop-saturate-150 border border-white/10 overflow-hidden"
              >
                <div className="divide-y divide-white/5">
                  {rest.map((entry) => {
                    const widthPercent = (entry.goals / maxGoalsInRest) * 100
                    return (
                      <ListRow
                        key={entry.scorerId}
                        entry={entry}
                        widthPercent={widthPercent}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

// ============================================
// PODIUM CARD
// ============================================
function PodiumCard({
  entry,
  tier,
  isFirst = false,
}: {
  entry: ButeurEntry
  tier: 1 | 2 | 3
  isFirst?: boolean
}) {
  const isSecond = tier === 2

  const cardPadding = isFirst
    ? "px-6 py-8 md:px-8 md:py-10"
    : isSecond
      ? "px-5 py-6 md:px-6 md:py-7"
      : "px-4 py-5 md:px-5 md:py-6"

  const rankSize = isFirst
    ? "text-7xl md:text-8xl"
    : isSecond
      ? "text-5xl md:text-6xl"
      : "text-4xl md:text-5xl"

  const rankSuffixSize = isFirst
    ? "text-xl md:text-2xl"
    : isSecond
      ? "text-lg md:text-xl"
      : "text-base md:text-lg"

  const crestSize = isFirst
    ? "w-20 h-20 md:w-24 md:h-24"
    : isSecond
      ? "w-14 h-14 md:w-16 md:h-16"
      : "w-10 h-10 md:w-12 md:h-12"

  const nameSize = isFirst
    ? "text-lg md:text-2xl"
    : isSecond
      ? "text-sm md:text-base"
      : "text-xs md:text-sm"

  const goalsSize = isFirst
    ? "text-5xl md:text-6xl"
    : isSecond
      ? "text-3xl md:text-4xl"
      : "text-2xl md:text-3xl"

  return (
    <div
      data-podium={tier}
      className={`
        flex flex-col items-center text-center
        rounded-2xl ${cardPadding}
        ${isFirst
          ? "bg-gradient-to-br from-lime-300/90 to-lime-600/80 text-bg"
          : "bg-white/[0.04] backdrop-blur-xl border border-white/10"
        }
      `}
    >
      {/* RANG */}
      <p
        className={`
          font-black tabular-nums leading-none mb-4
          ${rankSize}
          ${isFirst ? "text-bg" : "text-text-muted"}
        `}
      >
        {entry.rank}
        <span
          className={`
            ${rankSuffixSize} font-bold
            ${isFirst ? "text-bg/70" : "text-text-muted"}
          `}
        >
          {entry.rank === 1 ? "er" : "e"}
        </span>
      </p>

      {/* CREST de l'équipe (plus parlant qu'un avatar joueur) */}
      <div className={`${crestSize} shrink-0 mb-3 flex items-center justify-center`}>
        {entry.team.crestUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.team.crestUrl}
            alt={entry.team.shortName}
            className="w-full h-full object-contain"
          />
        ) : (
          <SoccerBall
            size={isFirst ? 64 : 40}
            weight="fill"
            className={isFirst ? "text-bg/30" : "text-text-muted"}
          />
        )}
      </div>

      {/* Nom du joueur */}
      <p
        className={`
          font-bold truncate max-w-full
          ${nameSize}
          ${isFirst ? "text-bg" : "text-text-primary"}
        `}
      >
        {entry.name}
      </p>

      {/* Club */}
      <p
        className={`
          text-xs mt-1
          ${isFirst ? "text-bg/70" : "text-text-muted"}
        `}
      >
        {entry.team.shortName}
      </p>

      {/* Buts */}
      <p
        className={`
          font-black tabular-nums mt-4
          ${goalsSize}
          ${isFirst ? "text-bg" : "text-text-primary"}
        `}
      >
        {entry.goals}
        <span
          className={`
            text-xs font-normal ml-1
            ${isFirst ? "text-bg/60" : "text-text-muted"}
          `}
        >
          buts
        </span>
      </p>
    </div>
  )
}

// ============================================
// LIST ROW pour les rangs 4-15
// ============================================
function ListRow({
  entry,
  widthPercent,
}: {
  entry: ButeurEntry
  widthPercent: number
}) {
  return (
    <div
      data-row
      data-target-width={`${widthPercent}%`}
      className="flex items-center gap-4 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
    >
      {/* GAUCHE FIXE : rang + crest + nom */}
      <div className="flex items-center gap-3 shrink-0 w-[260px]">
        <span className="text-2xl font-black w-9 shrink-0 tabular-nums text-text-muted">
          {entry.rank}
        </span>

        {/* Crest équipe */}
        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
          {entry.team.crestUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.team.crestUrl}
              alt={entry.team.shortName}
              className="w-full h-full object-contain"
            />
          ) : (
            <SoccerBall size={24} weight="fill" className="text-text-muted" />
          )}
        </div>

        {/* Nom + club */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate text-text-primary">
            {entry.name}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted truncate">
            {entry.team.shortName}
          </p>
        </div>
      </div>

      {/* BARRE ANIMÉE */}
      <div className="flex-1 min-w-0">
        <div
          data-bar
          className="h-10 rounded-md flex items-center justify-end pr-3 bg-gradient-to-r from-accent/60 to-accent/30"
          style={{ width: "0%" }}
        >
          <span
            data-goals
            className="text-lg font-black tabular-nums whitespace-nowrap text-text-primary"
          >
            {entry.goals}
            <span className="text-xs font-normal ml-1">buts</span>
          </span>
        </div>
      </div>
    </div>
  )
}