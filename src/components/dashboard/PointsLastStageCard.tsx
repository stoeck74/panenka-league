"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { CoinVertical } from "@phosphor-icons/react"

type PointsLastStageCardProps = {
  points: number
  matchdayNumber: number | null
}

const DIGIT_HEIGHT = 200 // px — chiffre beaucoup plus grand
const DIGITS_FOR_SHOW = "0123456789"

export function PointsLastStageCard({ points, matchdayNumber }: PointsLastStageCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const digits = String(Math.max(0, points)).split("")

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rollers = Array.from(
      container.querySelectorAll("[data-roller]"),
    ) as HTMLElement[]

    rollers.forEach((roller, idx) => {
      const targetDigit = parseInt(digits[idx], 10)
      if (isNaN(targetDigit)) return

      gsap.set(roller, { y: 0 })

      const cycles = 3
      const finalY = -((cycles * 10 + targetDigit) * DIGIT_HEIGHT)
      const duration = 1.2 + idx * 0.3

      gsap.to(roller, {
        y: finalY,
        duration,
        ease: "power3.out",
        delay: 0.2,
      })
    })

    return () => {
      gsap.killTweensOf(rollers)
    }
  }, [digits])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-xs uppercase tracking-widest text-text-muted">
            {matchdayNumber !== null ? `Journée ${matchdayNumber}` : "Saison"}
          </p>
        </div>
        <h3 className="text-xl font-bold text-text-primary">
          Points gagnés cette journée
        </h3>
      </div>

      {/* Slot machine — minimaliste, gros chiffres */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div
          ref={containerRef}
          className="flex items-baseline gap-1"
          style={{ height: `${DIGIT_HEIGHT}px` }}
        >
          {digits.map((_, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden"
              style={{
                width: `${DIGIT_HEIGHT * 0.60}px`,
                height: `${DIGIT_HEIGHT}px`,
              }}
            >
              <div data-roller className="absolute left-0 top-0 flex flex-col">
                {Array.from({ length: 4 }).map((_, cycleIdx) =>
                  DIGITS_FOR_SHOW.split("").map((d) => (
                    <span
                      key={`${cycleIdx}-${d}`}
                      className="font-black tabular-nums flex items-center justify-center"
                      style={{
                        height: `${DIGIT_HEIGHT}px`,
                        fontSize: `${DIGIT_HEIGHT * 0.9}px`,
                        lineHeight: 1,
                        background: "linear-gradient(135deg, #A8FF00, #65a30d)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {d}
                    </span>
                  )),
                )}
              </div>
            </div>
          ))}

          {/* Suffixe "pts" */}
        </div>
        <span className="text-text-muted ml-4">pts</span>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/5 text-center">
        <p className="text-xs uppercase tracking-widest text-text-muted">
          {points > 0
            ? "Cette journée"
            : matchdayNumber !== null
              ? "Aucun point sur cette journée"
              : "Pas encore de matchs joués"}
        </p>
      </div>
    </div>
  )
}