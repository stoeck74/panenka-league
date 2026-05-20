"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import type { ClassementEntry } from "@/lib/classement-data"

// ============================================
// CLASSEMENT VIEW
// Podium pour le top 3 + liste glassmorph pour le reste
// Adapté de wcl/LeaderboardChart
// ============================================

type ClassementViewProps = {
  entries: ClassementEntry[]
}

export function ClassementView({ entries }: ClassementViewProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const podiumRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const topThree = entries.slice(0, 3)
  const rest = entries.slice(3)
  const maxPointsInRest = Math.max(...rest.map((e) => e.totalPoints), 1)

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

    // ===== PODIUM =====
    const podium = podiumRef.current
    if (podium) {
      const podiumThird = podium.querySelector("[data-podium='3']")
      const podiumSecond = podium.querySelector("[data-podium='2']")
      const podiumFirst = podium.querySelector("[data-podium='1']")

      // État initial : tout en bas, invisible
      const podiumCards = [podiumFirst, podiumSecond, podiumThird].filter(Boolean)
      gsap.set(podiumCards, { opacity: 0, y: 60 })

      // Cascade : 3e → 2e → 1er
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

      // Pulse infini sur l'avatar du 1er
      const firstAvatar = podium.querySelector("[data-podium-avatar='1']")
      if (firstAvatar) {
        tl.to(firstAvatar, {
          scale: 1.06,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })
      }
    }

    // ===== LISTE =====
    const list = listRef.current
    if (list) {
      const rows = list.querySelectorAll("[data-row]")
      const bars: Element[] = []
      const labels: Element[] = []
      const targetWidths: string[] = []

      rows.forEach((row) => {
        const bar = row.querySelector("[data-bar]")
        const label = row.querySelector("[data-points]")
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
          delay: 1.6,
        })
      })

      gsap.to(labels, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        delay: 2.3,
      })
    }

    // Cleanup en cas d'unmount avant la fin
    return () => {
      gsap.killTweensOf("*")
    }
  }, [entries])

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-4 md:p-6 lg:p-8">
              {/* HEADER */}
        <header ref={headerRef}>
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Saison en cours
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            Classement
          </h1>
          <p className="text-text-secondary mt-1">
            {entries.length} joueur{entries.length > 1 ? "s" : ""}
          </p>
        </header>
      <div className="max-w-3xl mx-auto space-y-6">



        {/* ÉTAT VIDE */}
        {entries.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-12 text-center text-text-muted">
            Aucun joueur pour le moment
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

            {/* LISTE — Joueurs 4 et + */}
            {rest.length > 0 && (
              <div
                ref={listRef}
                className="rounded-2xl bg-black/35 backdrop-blur-xl backdrop-saturate-150 border border-white/10 overflow-hidden"
              >
                <div className="divide-y divide-white/5">
                  {rest.map((entry) => {
                    const widthPercent = (entry.totalPoints / maxPointsInRest) * 100
                    return (
                      <ListRow
                        key={entry.userId}
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
// PODIUM CARD — Une carte du podium (cliquable → profil)
// ============================================
function PodiumCard({
  entry,
  tier,
  isFirst = false,
}: {
  entry: ClassementEntry
  tier: 1 | 2 | 3
  isFirst?: boolean
}) {
  const isSecond = tier === 2
  const displayName = entry.name ?? entry.username

  const cardPadding = isFirst
    ? "px-6 py-8 md:px-8 md:py-10"
    : isSecond
      ? "px-5 py-6 md:px-6 md:py-7"
      : "px-4 py-5 md:px-5 md:py-6"

  const numberSize = isFirst
    ? "text-7xl md:text-8xl"
    : isSecond
      ? "text-5xl md:text-6xl"
      : "text-4xl md:text-5xl"

  const numberSuffixSize = isFirst
    ? "text-xl md:text-2xl"
    : isSecond
      ? "text-lg md:text-xl"
      : "text-base md:text-lg"

  const avatarSize = isFirst
    ? "w-24 h-24 md:w-32 md:h-32"
    : isSecond
      ? "w-16 h-16 md:w-20 md:h-20"
      : "w-12 h-12 md:w-16 md:h-16"

  const nameSize = isFirst
    ? "text-lg md:text-2xl"
    : isSecond
      ? "text-sm md:text-base"
      : "text-xs md:text-sm"

  const pointsSize = isFirst
    ? "text-4xl md:text-5xl"
    : isSecond
      ? "text-2xl md:text-3xl"
      : "text-xl md:text-2xl"

  return (
    <Link
      data-podium={tier}
      href={`/joueurs/${entry.username}`}
      className={`
        flex flex-col items-center text-center
        rounded-2xl ${cardPadding}
        transition-all hover:scale-[1.02]
        ${isFirst
          ? "bg-gradient-to-br from-lime-300/90 to-lime-600/80 text-bg"
          : "bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:bg-white/[0.06]"
        }
        ${!isFirst && entry.isCurrentUser ? "border-accent/40" : ""}
      `}
    >
      {/* NUMÉRO DE RANG */}
      <p
        className={`
          font-black tabular-nums leading-none mb-4
          ${numberSize}
          ${isFirst ? "text-bg" : "text-text-muted"}
        `}
      >
        {entry.rank}
        <span
          className={`
            ${numberSuffixSize} font-bold
            ${isFirst ? "text-bg/70" : "text-text-muted"}
          `}
        >
          {entry.rank === 1 ? "er" : "e"}
        </span>
      </p>

      {/* Avatar */}
      <div
        data-podium-avatar={tier}
        className={`
          ${avatarSize} rounded-full overflow-hidden border-2 shrink-0 mb-3
          ${isFirst ? "border-bg/20" : "border-white/15"}
        `}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Username */}
      <p
        className={`
          font-bold truncate max-w-full
          ${nameSize}
          ${isFirst ? "text-bg" : "text-text-primary"}
        `}
      >
        {displayName}
      </p>
      {entry.isCurrentUser && !isFirst && (
        <span className="text-[9px] uppercase tracking-widest font-bold text-accent mt-1">
          Moi
        </span>
      )}

      {/* Points */}
      <p
        className={`
          font-black tabular-nums mt-3
          ${pointsSize}
          ${isFirst ? "text-bg" : "text-text-primary"}
        `}
      >
        {entry.totalPoints}
        <span
          className={`
            text-xs font-normal ml-1
            ${isFirst ? "text-bg/60" : "text-text-muted"}
          `}
        >
          pts
        </span>
      </p>
    </Link>
  )
}

// ============================================
// LIST ROW — Ligne pour joueurs 4 et plus (cliquable → profil)
// ============================================
function ListRow({
  entry,
  widthPercent,
}: {
  entry: ClassementEntry
  widthPercent: number
}) {
  const displayName = entry.name ?? entry.username

  return (
    <Link
      data-row
      data-target-width={`${widthPercent}%`}
      href={`/joueurs/${entry.username}`}
      className={`
        flex items-center gap-4 px-4 py-2.5 transition-colors
        ${entry.isCurrentUser ? "bg-accent/[0.06]" : "hover:bg-white/[0.02]"}
      `}
    >
      {/* GAUCHE FIXE : rang + avatar + nom */}
      <div className="flex items-center gap-3 shrink-0 w-[220px]">

        {/* Rang */}
        <span
          className={`
            text-4xl font-black w-9 shrink-0 tabular-nums
            ${entry.isCurrentUser ? "text-white" : "text-text-muted"}
          `}
        >
          {entry.rank}
        </span>

        {/* Avatar */}
        <div
          className={`
            w-9 h-9 rounded-full overflow-hidden shrink-0 border
            ${entry.isCurrentUser ? "border-accent/40" : "border-white/10"}
          `}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Username */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span
            className={`
              text-md font-semibold truncate
              ${entry.isCurrentUser ? "text-text-primary" : "text-text-secondary"}
            `}
          >
            {displayName}
          </span>
          {entry.isCurrentUser && (
            <span className="text-[9px] uppercase tracking-widest font-bold text-accent shrink-0">
              Moi
            </span>
          )}
        </div>
      </div>

      {/* BARRE ANIMÉE */}
      <div className="flex-1 min-w-0">
        <div
          data-bar
          className="h-12 rounded-md flex items-center justify-end pr-3 bg-gradient-to-r from-blue-400/80 to-blue-600/50"
          style={{ width: "0%" }}
        >
          <span
            data-points
            className="text-xl font-black tabular-nums whitespace-nowrap text-text-primary"
          >
            {entry.totalPoints}
            <span className="text-xs font-normal ml-1">pts</span>
          </span>
        </div>
      </div>
    </Link>
  )
}