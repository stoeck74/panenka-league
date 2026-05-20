"use client"

import Link from "next/link"
import { Lightning, ArrowRight } from "@phosphor-icons/react"

export function GoldenBootCardStub() {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5 md:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">
          Meilleurs <span className="text-accent">Buteurs</span>
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-text-muted">
          Bientôt
        </span>
      </div>

      {/* État vide stylisé : 3 placeholders */}
      <div className="space-y-2 flex-1">
        {(["1er", "2e", "3e"] as const).map((rank, i) => (
          <div
            key={rank}
            className="flex items-center gap-3 p-2 rounded-lg bg-black/20 py-3 pl-3"
          >
            <span
              className={`
                text-xs font-bold uppercase tracking-widest shrink-0 w-6
                ${i === 0 ? "text-accent" : i === 1 ? "text-text-secondary" : "text-text-muted"}
              `}
            >
              {rank}
            </span>
            <div className="flex-1">
              <p className="text-sm text-text-muted italic">À déterminer</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton qui mène à la page buteurs (déjà fonctionnelle) */}
      <Link
        href="/buteurs"
        className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2 group"
      >
        Voir le classement des buteurs
        <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* Explication des règles à venir */}
      <p className="mt-4 pt-4 border-t border-white/5 text-xs text-text-muted leading-relaxed">
        Bientôt&nbsp;: pronostique le <span className="text-accent">top 3</span> des meilleurs buteurs de L1.
        <span className="text-accent"> +15 pts</span> par joueur dans le top 3, <span className="text-accent">+5 pts bonus</span> si à la bonne place.
      </p>
    </div>
  )
}