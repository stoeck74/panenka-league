"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { Skull } from "@phosphor-icons/react"
import type { WorstTeamForUser } from "@/lib/dashboard-data"

type WorstTeamCardProps = {
  worstTeam: WorstTeamForUser | null
}

export function WorstTeamCard({ worstTeam }: WorstTeamCardProps) {
  const crestRef = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLParagraphElement>(null)
  const [displayedMissed, setDisplayedMissed] = useState(0)

  useEffect(() => {
    if (!worstTeam) return

    // Pop du crest avec rotation inverse (vs TopTeam)
    if (crestRef.current) {
      gsap.fromTo(
        crestRef.current,
        { scale: 0, rotation: 180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.2,
          ease: "back.out(1.8)",
        },
      )

      // Léger tremblement périodique
      gsap.to(crestRef.current, {
        x: 2,
        duration: 0.08,
        delay: 2,
        repeat: -1,
        repeatDelay: 4,
        yoyo: true,
        yoyoEase: "power1.inOut",
      })
    }

    // Count up des ratés
    const obj = { value: 0 }
    const tween = gsap.to(obj, {
      value: worstTeam.missedCount,
      duration: 1.0,
      delay: 0.4,
      ease: "power2.out",
      onUpdate: () => setDisplayedMissed(Math.round(obj.value)),
    })

    return () => {
      tween.kill()
      if (crestRef.current) gsap.killTweensOf(crestRef.current)
    }
  }, [worstTeam])

  // État vide
  if (!worstTeam) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Skull size={36} weight="light" className="text-red-200" />
            <Skull size={36} weight="bold" className="text-red-600 blur-xs  absolute -z-10" />
            <Skull size={36} weight="light" className="text-red-200 blur-sm  absolute -z-20" />
            <p className="text-xs uppercase tracking-widest text-text-muted">
              Bête noire
            </p>
          </div>
          <h3 className="text-xl font-bold text-text-primary">
            <span className="text-red-600">Nemesis</span> Team
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center py-4">
          <p className="text-sm text-text-primary text-center max-w-[200px]">
            Aucun club ne t&apos;a fait perdre plus de 3 pronos pour l&apos;instant
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
          <Skull size={36} weight="light" className="text-red-600" />
          <p className="text-xs uppercase tracking-widest text-text-muted">
            Bête noire
          </p>
        </div>
        <h3 className="text-xl font-bold text-text-primary">
          Bête noire : <span className="text-red-500 uppercase">{worstTeam.shortName}</span>
        </h3>
      </div>

      {/* Zone visuelle — 2 colonnes : crest à gauche, ratés à droite */}
      <div className="flex-1 flex items-center justify-between gap-4 py-4">
        {/* Colonne gauche : crest */}
        <div className="flex flex-col items-center gap-2 shrink-0 w-1/2 border-r border-white/5">
          <div
            ref={crestRef}
            className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center"
          >
            {worstTeam.crestUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={worstTeam.crestUrl}
                alt={worstTeam.shortName}
                className="w-full h-full object-contain"
              />
            ) : (
              <Skull size={64} weight="fill" className="text-red-400/40" />
            )}
          </div>
        </div>

        {/* Colonne droite : nb de ratés centré */}
        <p
          ref={numberRef}
          className="text-5xl md:text-[4.5vw] font-black tabular-nums flex-1 text-center"
          style={{
            background: "linear-gradient(135deg, #f87171, #991b1b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {displayedMissed}
          <span className="text-base font-normal text-text-muted ml-1">ratés</span>
        </p>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/5 text-center">
        <p className="text-xs uppercase tracking-widest text-text-muted">
          sur {worstTeam.totalMatches} match{worstTeam.totalMatches > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}