"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"

type HeroProgressBarProps = {
  /**
   * Si null → la barre est cachée (aucune journée pronostiquable).
   * Sinon → on affiche la progression de la matchday.
   */
  progress: {
    matchdayNumber: number
    matchesCount: number
    predictionsMade: number
  } | null
}

export function HeroProgressBar({ progress }: HeroProgressBarProps) {
  const fillRef = useRef<HTMLDivElement>(null)
  const [displayedCount, setDisplayedCount] = useState(0)

  const percent =
    progress && progress.matchesCount > 0
      ? Math.round((progress.predictionsMade / progress.matchesCount) * 100)
      : 0

  // Animation au mount (et à chaque changement de progress)
  useEffect(() => {
    if (!progress) return

    if (fillRef.current) {
      gsap.fromTo(
        fillRef.current,
        { width: "0%" },
        {
          width: `${percent}%`,
          duration: 1.2,
          ease: "power2.out",
          delay: 0.2,
        }
      )
    }

    // Compteur animé
    const obj = { value: 0 }
    const tween = gsap.to(obj, {
      value: progress.predictionsMade,
      duration: 1.2,
      ease: "power2.out",
      delay: 0.2,
      onUpdate: () => setDisplayedCount(Math.round(obj.value)),
    })

    return () => {
      tween.kill()
      if (fillRef.current) gsap.killTweensOf(fillRef.current)
    }
  }, [progress, percent])

  // Aucune journée pronostiquable → on n'affiche rien
  if (!progress) return null

  return (
    <div>
      {/* Texte */}
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm text-text-secondary">
          <span className="text-xs uppercase tracking-widest text-text-muted mr-2">
            Journée {progress.matchdayNumber}
          </span>
          <span className="text-text-primary font-bold tabular-nums">
            {displayedCount}
          </span>
          <span className="text-text-muted"> / {progress.matchesCount} pronos</span>
        </p>
        <p className="text-xs uppercase tracking-widest text-text-muted tabular-nums">
          {percent}%
        </p>
      </div>

      {/* Barre */}
      <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          ref={fillRef}
          className="absolute inset-y-0 left-0 bg-accent rounded-full"
          style={{ width: "0%" }}
        />
      </div>
    </div>
  )
}