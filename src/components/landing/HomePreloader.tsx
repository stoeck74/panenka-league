"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"


type HomePreloaderProps = {
  isVideoReady: boolean
  onAnimationComplete?: () => void
}

export function HomePreloader({ isVideoReady, onAnimationComplete }: HomePreloaderProps) {
  const preloaderRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const isAnimating = useRef(false)

  useEffect(() => {
    // Animation du fill : 0% → 100% en boucle infinie jusqu'à ce que la vidéo soit prête
    if (!fillRef.current || !textRef.current) return

    // Fill animation : monte de 0 à 100% en 2 secondes, en boucle
    gsap.fromTo(
      fillRef.current,
      { height: "0%" },
      {
        height: "100%",
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
      }
    )

    // Texte fade-in après 0.4s
    gsap.fromTo(
      textRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power3.out" }
    )
  }, [])

  useEffect(() => {
    if (!isVideoReady || isAnimating.current) return
    if (!preloaderRef.current) return

    isAnimating.current = true

    // Stop l'animation du fill et le remplit à 100% rapide
    if (fillRef.current) {
      gsap.killTweensOf(fillRef.current)
      gsap.to(fillRef.current, {
        height: "100%",
        duration: 0.4,
        ease: "power2.out",
      })
    }

    // Fade-out du preloader entier après 0.6s
    gsap.to(preloaderRef.current, {
      opacity: 0,
      duration: 0.8,
      delay: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        if (preloaderRef.current) {
          preloaderRef.current.style.display = "none"
        }
        onAnimationComplete?.()
      },
    })
  }, [isVideoReady, onAnimationComplete])

  return (
    <div
      ref={preloaderRef}
className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] pointer-events-none"
    >
      {/* Conteneur du logo avec les 2 layers */}
      <div className="relative w-32 h-32 md:w-40 md:h-40">

        {/* Layer 1 : Logo "filigrane" (fond, opacity 15%) */}
        <img
          src="/logo.svg"
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.15 }}
        />

        {/* Layer 2 : Logo "fill" qui se révèle progressivement de bas en haut */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            ref={fillRef}
            className="w-full overflow-hidden"
            style={{ height: "0%" }}
          >
            {/* Le logo dans son conteneur "rempli" */}
            <img
              src="/logo.svg"
              alt="Panenka League"
              className="w-full h-auto absolute bottom-0 left-0"
              style={{
                height: "100%",
                objectFit: "contain",
                objectPosition: "bottom",
              }}
            />
          </div>
        </div>
      </div>

      {/* Texte sous le logo */}
      <div ref={textRef} className="mt-8 text-center">
        <p className="text-2xl md:text-3xl font-extrabold tracking-wider text-text-primary">
          PANENKA
        </p>
        <p className="text-base md:text-lg font-medium text-text-secondary -mt-1">
          League
        </p>
      </div>
    </div>
  )
}