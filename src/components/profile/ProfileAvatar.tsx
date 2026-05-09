"use client"

import { useState, useRef, useEffect } from "react"
import { Shuffle, Check } from "@phosphor-icons/react"
import { updateAvatar } from "@/lib/actions/profile"

type Props = {
  initialStyle: string | null
  initialSeed: string | null
  username: string
  isOwnProfile: boolean
}

const STYLES = [
  { id: "toon-head", label: "Toon Head" },
  { id: "personas", label: "Personas" },
]

const buildAvatarUrl = (style: string, seed: string) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`

const randomSeed = () => Math.random().toString(36).slice(2, 12)

export function ProfileAvatar({ initialStyle, initialSeed, username, isOwnProfile }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [style, setStyle] = useState(initialStyle ?? "toon-head")
  const [seed, setSeed] = useState(initialSeed ?? username)
  const [isSaving, setIsSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fermer le panneau si on clique en dehors
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen])

  const avatarUrl = buildAvatarUrl(style, seed)

  const handleShuffle = () => {
    setSeed(randomSeed())
  }

  const handleStyleChange = (newStyle: string) => {
    setStyle(newStyle)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateAvatar(style, seed)
    setIsSaving(false)
    if (result.success) {
      setIsOpen(false)
    }
  }

  // Mode lecture seule (autre profil ou pas connecté)
  if (!isOwnProfile) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-white/10 bg-white/5"
      />
    )
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative block"
        aria-label="Modifier mon avatar"
      >
        <img
          src={avatarUrl}
          alt={username}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-white/10 group-hover:border-accent bg-white/5 transition-colors"
        />
        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
          <span className="text-xs uppercase tracking-widest text-text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
            Modifier
          </span>
        </div>
      </button>

      {/* Panneau d'édition */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-3 w-72 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl z-50 p-4">

          {/* Choix du style */}
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
            Style
          </p>
          <div className="flex gap-2 mb-4">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStyleChange(s.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  style === s.id
                    ? "bg-accent text-bg"
                    : "bg-white/[0.05] text-text-secondary hover:bg-white/[0.1] hover:text-text-primary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Bouton shuffle */}
          <button
            type="button"
            onClick={handleShuffle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-4 rounded-lg bg-white/[0.03] border border-white/10 text-text-secondary hover:bg-white/[0.06] hover:text-accent transition-colors"
          >
            <Shuffle size={14} weight="bold" />
            <span className="text-xs uppercase tracking-widest font-semibold">
              Nouvel avatar
            </span>
          </button>

          {/* Bouton enregistrer */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-bg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={14} weight="bold" />
            <span className="text-xs uppercase tracking-widest font-bold">
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </span>
          </button>

        </div>
      )}
    </div>
  )
}