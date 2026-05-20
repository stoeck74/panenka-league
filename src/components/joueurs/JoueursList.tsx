"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { Heart } from "@phosphor-icons/react"
import type { JoueurCard } from "@/lib/joueurs-data"

type JoueursListProps = {
  joueurs: JoueurCard[]
}

export function JoueursList({ joueurs }: JoueursListProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // ============================================
  // ANIMATION D'ENTRÉE — Stagger des cards
  // ============================================
  useEffect(() => {
    const header = headerRef.current
    const grid = gridRef.current
    if (!header || !grid) return

    const cards = Array.from(grid.children) as HTMLElement[]
    const elements = [header, ...cards]

    gsap.set(elements, { opacity: 0, y: 24 })
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: "power3.out",
      delay: 0.1,
    })

    return () => {
      gsap.killTweensOf(elements)
    }
  }, [joueurs.length])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl ">

        {/* HEADER */}
        <header ref={headerRef} className="mb-8">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Panenka League
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            Joueurs
          </h1>
          <p className="text-text-secondary mt-1">
            {joueurs.length} membre{joueurs.length > 1 ? "s" : ""}
          </p>
        </header>

        {/* GRILLE */}
        {joueurs.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-12 text-center text-text-muted">
            Aucun joueur pour le moment
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {joueurs.map((joueur) => (
              <JoueurCardComponent key={joueur.userId} joueur={joueur} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

// ============================================
// CARD JOUEUR (cliquable → profil)
// ============================================
function JoueurCardComponent({ joueur }: { joueur: JoueurCard }) {
  const displayName = joueur.name ?? joueur.username

  return (
    <Link
      href={`/joueurs/${joueur.username}`}
      className={`
        group relative flex flex-col gap-4 rounded-2xl p-5
        border backdrop-blur-xl transition-all
        ${joueur.isCurrentUser
          ? "bg-accent/[0.08] border-accent/30 hover:bg-accent/[0.12]"
          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
        }
      `}
    >
      {/* Header card : avatar + identité */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={joueur.avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-text-primary truncate">
            {displayName}

          </p>
          {joueur.name && (
            <p className="text-xs text-text-muted truncate">
              @{joueur.username}
            </p>
          )}
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-white/5" />

      {/* Équipe favorite */}
      <div className="flex items-center gap-3 min-h-[40px]">
        <p className="text-[10px] uppercase tracking-widest text-text-muted w-20 shrink-0">
          Équipe
        </p>
        {joueur.favoriteTeam ? (
          <div className="flex items-center gap-2 min-w-0">
            {joueur.favoriteTeam.crestUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={joueur.favoriteTeam.crestUrl}
                alt={joueur.favoriteTeam.name}
                className="w-6 h-6 object-contain shrink-0"
              />
            )}
            <span className="text-sm font-semibold text-text-primary truncate">
              {joueur.favoriteTeam.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-text-muted italic">Non renseignée</span>
        )}
      </div>

      {/* Joueur favori */}
      <div className="flex items-center gap-3 min-h-[24px]">
        <p className="text-[10px] uppercase tracking-widest text-text-muted w-20 shrink-0">
          Joueur
        </p>
        {joueur.favoritePlayer ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-text-primary truncate">
              {joueur.favoritePlayer}
            </span>
          </div>
        ) : (
          <span className="text-sm text-text-muted italic">Non renseigné</span>
        )}
      </div>
    </Link>
  )
}