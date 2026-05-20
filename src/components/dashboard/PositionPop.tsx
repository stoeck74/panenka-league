"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import confetti from "canvas-confetti"

type PositionPopProps = {
  position: number
  totalPlayers: number
}

export function PositionPop({ position, totalPlayers }: PositionPopProps) {
  const numberRef = useRef<HTMLSpanElement>(null)
  const suffixRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!numberRef.current || !suffixRef.current) return

    const tl = gsap.timeline({ delay: 0.3 })

    tl.fromTo(
      [numberRef.current, suffixRef.current],
      {
        scale: 0,
        rotation: -25,
        opacity: 0,
      },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)",
      }
    )

    // Confettis pour tout le monde, plus généreux pour le podium
    const timeoutId = setTimeout(() => {
      const rect = numberRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight

      // Palette lime/accent pour cohérence Panenka
      const colors =
        position === 1
          ? ["#A8FF00", "#bef264", "#fde68a", "#ffffff"]
          : position === 2
            ? ["#cbd5e1", "#e2e8f0", "#A8FF00", "#ffffff"]
            : position === 3
              ? ["#d97706", "#fbbf24", "#A8FF00", "#ffffff"]
              : ["#A8FF00", "#bef264", "#ffffff", "#fde68a"]

      confetti({
        particleCount: position === 1 ? 120 : 80,
        spread: 80,
        startVelocity: 35,
        origin: { x, y },
        colors,
        scalar: 0.9,
        gravity: 1.8,
        ticks: 100,
      })
    }, 600)

    return () => clearTimeout(timeoutId)
  }, [position])

  // Suffixe : "er" pour 1, "e" pour les autres
  const suffix = position === 1 ? "er" : "e"

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      {/* Numéro géant */}
      <div className="flex items-baseline justify-center flex-1">
        <span
          ref={numberRef}
          className="text-[14vw] md:text-[10vw] lg:text-[12vw] font-black text-neutral-900 leading-none inline-block origin-bottom"
        >
          {position}
        </span>
        <span
          ref={suffixRef}
          className="text-5xl md:text-6xl text-neutral-900 font-bold inline-block origin-bottom"
        >
          {suffix}
        </span>
      </div>

      {/* "sur X joueurs" */}
      <p className="text-sm uppercase tracking-widest text-neutral-900">
        sur {totalPlayers} joueur{totalPlayers > 1 ? "s" : ""}
      </p>
    </div>
  )
}