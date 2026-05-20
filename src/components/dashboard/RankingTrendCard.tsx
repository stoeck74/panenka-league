"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Lightning, Hand } from "@phosphor-icons/react"
import type { RankingTrend } from "@/lib/dashboard-data"

// Enregistre le plugin (idempotent)
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type RankingTrendCardProps = {
  trend: RankingTrend
}

export function RankingTrendCard({ trend }: RankingTrendCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<SVGSVGElement>(null)
  const deltaRef = useRef<HTMLParagraphElement>(null)
  const [displayedDelta, setDisplayedDelta] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    if (trend.trend === "first") return

    // ScrollTrigger : déclenche quand la card entre dans le viewport, 1 fois
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current!,
          start: "top 85%",      // déclenche dès que le haut de la card touche les 85% du viewport
          toggleActions: "play none none none", // play once, no reverse
        },
      })

      // 1. Animation de la clip-path (révélation progressive)
      if (arrowRef.current) {
        const clipRect = arrowRef.current.querySelector<SVGRectElement>("[data-clip-rect]")

        if (clipRect && trend.trend === "up") {
          tl.fromTo(
            clipRect,
            { attr: { y: 256, height: 0 } },
            {
              attr: { y: 0, height: 256 },
              duration: 1.2,
              ease: "power2.out",
            },
            0,
          )
        } else if (clipRect && trend.trend === "down") {
          tl.fromTo(
            clipRect,
            { attr: { height: 0 } },
            {
              attr: { height: 256 },
              duration: 1.2,
              ease: "power2.out",
            },
            0,
          )
        }

        // Léger flottement permanent après la révélation
        if (trend.trend === "up") {
          tl.to(
            arrowRef.current,
            { y: -4, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut" },
            1.4,
          )
        } else if (trend.trend === "down") {
          tl.to(
            arrowRef.current,
            { y: 4, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut" },
            1.4,
          )
        }
      }

      // 4. Count up du delta
      const obj = { value: 0 }
      tl.to(
        obj,
        {
          value: Math.abs(trend.delta),
          duration: 1.0,
          ease: "power2.out",
          onUpdate: () => setDisplayedDelta(Math.round(obj.value)),
        },
        0.4,
      )
    }, containerRef)

    return () => ctx.revert()
  }, [trend])

  // ============================================
  // ÉTATS
  // ============================================

  // État "first" : pas assez de matchdays FINISHED pour comparer
  if (trend.trend === "first") {
    return (
      <div ref={containerRef} className="h-full flex flex-col">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Lightning size={36} weight="light" className="text-accent" />
            <p className="text-xs uppercase tracking-widest text-text-muted">
              Tendance
            </p>
          </div>
          <h3 className="text-xl font-bold text-text-primary">
            Position en mouvement
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center py-4">
          <p className="text-sm text-text-muted text-center max-w-[220px]">
            La tendance s&apos;activera après la 2<sup>e</sup> journée jouée
          </p>
        </div>
      </div>
    )
  }

  // ============================================
  // ÉTAT NORMAL : up / down / stable
  // ============================================

  const isUp = trend.trend === "up"
  const isDown = trend.trend === "down"
  const isStable = trend.trend === "stable"

  // Couleurs selon la tendance
  const colorClass = isUp
    ? "text-accent"
    : isDown
      ? "text-red-400"
      : "text-text-muted"

  const gradientStart = isUp ? "#A8FF00" : isDown ? "#f87171" : "#737373"
  const gradientEnd = isUp ? "#65a30d" : isDown ? "#991b1b" : "#525252"

  const label = isUp
    ? "Tu remontes !"
    : isDown
      ? "Tu descends..."
      : "Position stable"

  // Construction d'une éventuelle phrase narrative
  const narrative = isUp
    ? trend.overtakenUsernames.length > 0
      ? `Tu as dépassé ${trend.overtakenUsernames.length === 1
          ? trend.overtakenUsernames[0]
          : `${trend.overtakenUsernames.length} joueurs`}`
      : null
    : null

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Lightning size={36} weight="light" className={colorClass} />
          <p className="text-xs uppercase tracking-widest text-text-muted">
            Journée {trend.matchdayNumber}
          </p>
        </div>
        <h3 className="text-xl font-bold text-text-primary">
          {label}
        </h3>
      </div>

{/* Zone visuelle : flèche + delta côte à côte, plus aérée */}
      <div className="flex-1 flex items-center justify-center gap-6 py-4">
        {/* Flèche grande */}
        <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center shrink-0">
          <TrendArrow
            ref={arrowRef}
            direction={isUp ? "up" : isDown ? "down" : "stable"}
          />
        </div>

        {/* Delta */}
{!isStable && (
          <p
            ref={deltaRef}
            className="text-5xl md:text-[6vw] font-black tabular-nums"
            style={{
              background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {isUp ? "+" : "-"}{displayedDelta}
            <span className="text-base font-normal text-text-muted ml-1">
              {displayedDelta > 1 ? "places" : "place"}
            </span>
          </p>
        )}
      </div>

      {/* Footer : narrative + bouton poc placeholder */}
      <div className="pt-4 border-t border-white/5">
        {narrative ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-text-muted truncate">
              {narrative}
            </p>
            <button
              type="button"
              className="text-xs font-bold uppercase tracking-widest text-accent hover:text-accent-hover transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              onClick={() => {
                // TODO : implémentation poc backend
                console.log("poc → ", trend.overtakenUsernames)
              }}
            >
              <Hand size={14} weight="bold" />
              Poc
            </button>
          </div>
        ) : (
          <p className="text-xs uppercase tracking-widest text-text-muted text-center">
            {isStable
              ? "Aucune place change\u00e9e"
              : isDown
                ? `${trend.previousPosition}e → ${trend.currentPosition}e`
                : "Bien jou\u00e9"}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================
// SOUS-COMPOSANT : flèche de tendance avec clip-path animé
// ============================================

type TrendArrowProps = {
  direction: "up" | "down" | "stable"
}

const TrendArrow = ({
  ref,
  direction,
}: TrendArrowProps & { ref: React.Ref<SVGSVGElement> }) => {
  const color =
    direction === "up"
      ? "#A8FF00"
      : direction === "down"
        ? "#f87171"
        : "#737373"

  // ID unique du clip-path (pour pas collision avec d'autres SVG)
  const clipId = `trend-clip-${direction}`
  const glowId = `trend-glow-${direction}`

   if (direction === "stable") {
    return (
      <div
        ref={ref as unknown as React.Ref<HTMLDivElement>}
        className="w-full h-full flex items-center justify-center"
      >
        <span
          className="font-black text-accent"
          style={{
            fontSize: "8rem",
            lineHeight: 1,
          }}
        >
          =
        </span>
      </div>
    )
  }

  // UP — clip-path qui révèle du bas vers le haut
  if (direction === "up") {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        width="100%"
        height="100%"
        fill={color}
      >
        <defs>
          <clipPath id={clipId}>
            {/* Rect en bas qui grandit vers le haut : on anime `y` ET `height` */}
            <rect data-clip-rect x="0" y="256" width="256" height="0" />
          </clipPath>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          filter={`url(#${glowId})`}
          clipPath={`url(#${clipId})`}
          d="M240,56v64a8,8,0,0,1-16,0V75.31l-82.34,82.35a8,8,0,0,1-11.32,0L96,123.31,29.66,189.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0L136,140.69,212.69,64H168a8,8,0,0,1,0-16h64A8,8,0,0,1,240,56Z"
        />
      </svg>
    )
  }

  // DOWN — clip-path qui révèle du haut vers le bas
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="100%"
      height="100%"
      fill={color}
    >
      <defs>
        <clipPath id={clipId}>
          <rect data-clip-rect x="0" y="0" width="256" height="0" />
        </clipPath>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        filter={`url(#${glowId})`}
        clipPath={`url(#${clipId})`}
        d="M240,128v64a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h44.69L136,107.31l-34.34,34.35a8,8,0,0,1-11.32,0l-72-72A8,8,0,0,1,29.66,58.34L96,124.69l34.34-34.35a8,8,0,0,1,11.32,0L224,172.69V128a8,8,0,0,1,16,0Z"
      />
    </svg>
  )
}