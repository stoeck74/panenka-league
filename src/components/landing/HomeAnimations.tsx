"use client"

import { useEffect } from "react"
import { gsap } from "gsap"

export function HomeAnimations() {
  useEffect(() => {
    // Sélectionne tous les éléments à animer dans l'ordre
    const label = document.querySelector("[data-anim='label']")
    const slot = document.querySelector("[data-anim='slot']")
    const divider = document.querySelector("[data-anim='divider']")
    const tagline = document.querySelector("[data-anim='tagline']")
    const cta = document.querySelector("[data-anim='cta']")
    const footer = document.querySelector("[data-anim='footer']")
    const nav = document.querySelector("[data-anim='nav']")

    const elements = [nav, label, slot, divider, tagline, cta, footer].filter(Boolean)

    // Reset initial : tout invisible et décalé vers le bas
    gsap.set(elements, { opacity: 0, y: 30 })

    // Animation d'entrée stagger
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      delay: 0.3,
    })

    // Animation continue subtile sur le CTA (pulse de l'ombre)
    if (cta) {
      gsap.to(cta, {
        scale: 1.02,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2,
      })
    }
  }, [])

  return null
}