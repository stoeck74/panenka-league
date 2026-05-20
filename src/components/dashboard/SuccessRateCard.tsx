"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ChartDonut } from "@phosphor-icons/react"

type SuccessRateCardProps = {
  /** Pronos qui ont gagné des points (bons résultats + scores exacts) */
  goodResults: number
  /** Total pronos sur matchs FINISHED */
  totalFinished: number
}

export function SuccessRateCard({ goodResults, totalFinished }: SuccessRateCardProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const [displayedPercent, setDisplayedPercent] = useState(0)

  const percent = totalFinished > 0 ? Math.round((goodResults / totalFinished) * 100) : 0

  // Calculs SVG
  const size = 120
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference - (percent / 100) * circumference

  useEffect(() => {
    if (!circleRef.current) return

    gsap.set(circleRef.current, { strokeDashoffset: circumference })

    gsap.to(circleRef.current, {
      strokeDashoffset: targetOffset,
      duration: 1.4,
      ease: "power3.out",
      delay: 0.3,
    })

    const obj = { value: 0 }
    const tween = gsap.to(obj, {
      value: percent,
      duration: 1.4,
      ease: "power3.out",
      delay: 0.3,
      onUpdate: () => setDisplayedPercent(Math.round(obj.value)),
    })

    return () => {
      tween.kill()
      if (circleRef.current) gsap.killTweensOf(circleRef.current)
    }
  }, [percent, targetOffset, circumference])

  return (
    <div className="rounded-2xl bg-black/15 border border-white/10 backdrop-blur-xl p-6 md:p-8 flex flex-col h-full overflow-hidden">
        <div className="absolute top-2/3 h-full w-full bg-gradient-to-t from-accent to-transparent rounded-full blur-3xl pointer-events-none isolate" />

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ChartDonut size={36} weight="light" className="text-accent" />
          <p className="text-xs uppercase tracking-widest text-text-muted">
            Saison en cours
          </p>
        </div>
        <h3 className="text-xl font-bold text-text-primary">
          Taux de réussite
        </h3>
      </div>

      {/* Donut */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="relative w-full max-w-[180px] aspect-square">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full -rotate-90"
          >
            <defs>
              <linearGradient id="donut-gradient-panenka" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A8FF00" />
                <stop offset="50%" stopColor="#bef264" />
                <stop offset="100%" stopColor="#65a30d" />
              </linearGradient>
              <filter id="donut-glow-panenka">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Cercle de fond */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
            />

            {/* Cercle de progression */}
            <circle
              ref={circleRef}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#donut-gradient-panenka)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              filter="url(#donut-glow-panenka)"
            />
          </svg>

          {/* Chiffre au centre */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-3xl md:text-4xl font-black text-text-primary tabular-nums">
              {displayedPercent}
              <span className="text-lg font-normal text-text-muted ml-0.5">%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/5 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-200">
          {totalFinished > 0
            ? `${goodResults} / ${totalFinished} pronos justes`
            : "Pas encore de matchs joués"}
        </p>
      </div>
    </div>
  )
}