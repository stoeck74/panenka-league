"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

const WORDS = ["JOUE ", "SUIS ", "GAGNE !"]

export function SlotMachine() {
  const containerRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const container = containerRef.current
  if (!container) return

  const slots = container.querySelectorAll<HTMLDivElement>("[data-word]")
  const slotHeight = container.offsetHeight

  // JOUE est déjà à 0 (visible) via le style inline
  // SUIS et GAGNE sont à -100% (cachés au-dessus) via le style inline
  // GSAP prend le relais à partir d'ici

  const tl = gsap.timeline({ delay: 1.2 })

  // ============================================
  // JOUE sort par le bas, SUIS descend du haut
  // ============================================
  tl.to(slots[0], {
    y: slotHeight,
    duration: 0.25,
    ease: "power4.out",
  })
  tl.to(slots[1], {
    y: 0,
    duration: 0.25,
    ease: "power4.out",
  }, "<")

  // Pause sur SUIS
  tl.to({}, { duration: 1.2 })

  // ============================================
  // SUIS sort par le bas, GAGNE descend du haut
  // ============================================
  tl.to(slots[1], {
    y: slotHeight,
    duration: 0.15,
    ease: "power4.out",
  })
  tl.to(slots[2], {
    y: 0,
    duration: 0.15,
    ease: "power4.out",
  }, "<")

  return () => {
    tl.kill()
  }
}, [])

return (
  <div
    ref={containerRef}
    className="relative overflow-hidden leading-none w-full"
    style={{ height: "1em" }}
  >
    {WORDS.map((word, index) => (
      <div
        key={index}
        data-word
        className="absolute inset-0 flex items-center justify-center md:justify-start"
        style={{
          // Le premier mot est visible par défaut, les autres cachés au-dessus
          transform: index === 0 ? "translateY(0)" : `translateY(-100%)`,
        }}
      >
        <span className="leading-none">
          {word}
        </span>
      </div>
    ))}
  </div>
)
}