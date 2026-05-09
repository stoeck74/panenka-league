"use client"

import { useState, useRef, useEffect } from "react"
import { CaretDown } from "@phosphor-icons/react"
import { updateFavoriteTeam } from "@/lib/actions/profile"

type Team = {
  id: string
  name: string
  shortName: string
  tla: string
  crestUrl: string | null
}

type Props = {
  teams: Team[]
  currentTeamId: string | null
  isOwnProfile: boolean
}

export function ProfileFavoriteTeam({ teams, currentTeamId, isOwnProfile }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(currentTeamId)
  const [isSaving, setIsSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedTeam = teams.find((t) => t.id === selectedId) ?? null

  // Fermer le dropdown si on clique en dehors
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

  const handleSelect = async (teamId: string) => {
    setIsOpen(false)
    if (teamId === selectedId) return
    setIsSaving(true)
    setSelectedId(teamId)
    const result = await updateFavoriteTeam(teamId)
    setIsSaving(false)
    if (!result.success) {
      setSelectedId(currentTeamId) // rollback en cas d'erreur
    }
  }

  // Mode lecture (autre profil)
  if (!isOwnProfile) {
    return (
      <div className="flex items-center justify-between py-4 border-b border-white/10">
        <p className="text-xs uppercase tracking-widest text-text-muted">
          Équipe favorite
        </p>
        {selectedTeam ? (
          <div className="flex items-center gap-3">
            {selectedTeam.crestUrl && (
              <img src={selectedTeam.crestUrl} alt={selectedTeam.shortName} className="w-8 h-8 object-contain" />
            )}
            <span className="text-base font-semibold text-text-primary">
              {selectedTeam.shortName}
            </span>
          </div>
        ) : (
          <span className="text-sm text-text-muted italic">Non renseignée</span>
        )}
      </div>
    )
  }

  // Mode édition (mon profil)
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        className="w-full group flex items-center justify-between py-4 border-b border-white/10 -mx-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <p className="text-xs uppercase tracking-widest text-text-muted">
          Équipe favorite
        </p>
        <div className="flex items-center gap-3">
          {selectedTeam ? (
            <>
              {selectedTeam.crestUrl && (
                <img src={selectedTeam.crestUrl} alt={selectedTeam.shortName} className="w-8 h-8 object-contain" />
              )}
              <span className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                {selectedTeam.shortName}
              </span>
            </>
          ) : (
            <span className="text-sm text-text-muted italic group-hover:text-accent transition-colors">
              Choisir une équipe
            </span>
          )}
          <CaretDown
            size={14}
            weight="bold"
            className={`text-text-muted group-hover:text-accent transition-all ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl z-50 p-2">
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => handleSelect(team.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                team.id === selectedId
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-white/[0.05] hover:text-text-primary"
              }`}
            >
              {team.crestUrl && (
                <img src={team.crestUrl} alt={team.shortName} className="w-6 h-6 object-contain shrink-0" />
              )}
              <span className="text-sm font-semibold">{team.shortName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}