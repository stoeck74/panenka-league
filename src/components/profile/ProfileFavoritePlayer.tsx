"use client"

import { useState } from "react"
import { EditableField } from "./EditableField"
import { updateFavoritePlayer } from "@/lib/actions/profile"

type Props = {
  initialValue: string | null
  isOwnProfile: boolean
}

export function ProfileFavoritePlayer({ initialValue, isOwnProfile }: Props) {
  const [isEditing, setIsEditing] = useState(false)

  if (!isOwnProfile) {
    return initialValue ? (
      <span className="text-base font-semibold text-text-primary">
        {initialValue}
      </span>
    ) : (
      <span className="text-sm text-text-muted italic">
        Non renseigné
      </span>
    )
  }

  return (
    <div
      onClick={() => !isEditing && setIsEditing(true)}
      className={`group flex items-center justify-between py-4 border-b border-white/10 -mx-2 px-2 rounded-lg transition-colors ${!isEditing ? "cursor-pointer hover:bg-white/[0.02]" : ""}`}
    >
      <p className="text-xs uppercase tracking-widest text-text-muted">
        Joueur favori
      </p>
      <EditableField
        initialValue={initialValue}
        placeholder="Ex: Mbappé"
        onSave={updateFavoritePlayer}
        emptyLabel="Cliquer pour renseigner"
        isEditing={isEditing}
        onStartEdit={() => setIsEditing(true)}
        onStopEdit={() => setIsEditing(false)}
      />
    </div>
  )
}