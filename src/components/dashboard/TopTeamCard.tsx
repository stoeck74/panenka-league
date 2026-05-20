"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ShieldStar } from "@phosphor-icons/react"
import type { TopTeamForUser } from "@/lib/dashboard-data"

type TopTeamCardProps = {
  topTeam: TopTeamForUser | null
}

export function TopTeamCard({ topTeam }: TopTeamCardProps) {
  const crestRef = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLParagraphElement>(null)
  const [displayedPoints, setDisplayedPoints] = useState(0)

  useEffect(() => {
    if (!topTeam) return

    // Pop du crest avec rotation
    if (crestRef.current) {
      gsap.fromTo(
        crestRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.2,
          ease: "back.out(1.8)",
        },
      )

      // Léger flottement en boucle
      gsap.to(crestRef.current, {
        y: -4,
        duration: 1.8,
        delay: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })
    }

    // Count up des points
    const obj = { value: 0 }
    const tween = gsap.to(obj, {
      value: topTeam.totalPoints,
      duration: 1.2,
      delay: 0.4,
      ease: "power2.out",
      onUpdate: () => setDisplayedPoints(Math.round(obj.value)),
    })

    return () => {
      tween.kill()
      if (crestRef.current) gsap.killTweensOf(crestRef.current)
    }
  }, [topTeam])

  // État vide
  if (!topTeam) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldStar size={36} weight="light" className="text-accent" />
            <p className="text-xs uppercase tracking-widest text-text-muted">
              Top équipe
            </p>
          </div>
          <h3 className="text-xl font-bold text-text-primary">
            <span className="text-accent">Ton</span> club fétiche
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center py-4">
          <p className="text-sm text-text-muted text-center">
            Pas encore de points marqués
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldStar size={36} weight="light" className="text-accent" />
          <p className="text-xs uppercase tracking-widest text-text-muted">
            Ton club fétiche
          </p>
        </div>
        <h3 className="text-xl font-bold text-text-primary">
         Club fétiche : <span className="text-accent uppercase">{topTeam.shortName}</span>
        </h3>
      </div>

      {/* Zone visuelle */}
{/* Zone visuelle — 2 colonnes : crest+nom à gauche, points à droite */}
      <div className="flex-1 flex items-center justify-between gap-4 py-4">
        {/* Colonne gauche : crest + nom empilés */}
        <div className="flex flex-col items-center gap-2 shrink-0  w-1/2 border-r border-white/5">
          <div
            ref={crestRef}
            className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center"
          >
            {topTeam.crestUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={topTeam.crestUrl}
                alt={topTeam.shortName}
                className="w-full h-full object-contain"
              />
            ) : (
              <ShieldStar size={64} weight="fill" className="text-accent/40" />
            )}
          </div>

        </div>

        {/* Colonne droite : points centrés verticalement */}
        <p
          ref={numberRef}
          className="text-5xl md:text-[6vw] font-black tabular-nums flex-1 text-center"
          style={{
            background: "linear-gradient(135deg, #A8FF00, #65a30d)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {displayedPoints}
          <span className="text-base font-normal text-text-muted ml-1">pts</span>
        </p>
      </div>

      {/* Footer */}
      {/* Footer */}
      <div className="pt-4 border-t border-white/5 text-center">
        <p className="text-xs uppercase tracking-widest text-text-muted">
          {topTeam.matchesCount === 0
            ? "Pas encore de points"
            : `sur ${topTeam.matchesCount} match${topTeam.matchesCount > 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  )
}