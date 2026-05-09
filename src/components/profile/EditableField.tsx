"use client"

import { useState, useRef, useEffect } from "react"
import { Pencil, Check, X } from "@phosphor-icons/react"

type EditableFieldProps = {
  initialValue: string | null
  placeholder?: string
  onSave: (value: string) => Promise<{ success?: boolean; error?: string }>
  emptyLabel?: string
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
}

export function EditableField({
  initialValue,
  placeholder = "Saisir une valeur",
  onSave,
  emptyLabel = "Non renseigné",
  isEditing,
  onStartEdit,
  onStopEdit,
}: EditableFieldProps) {
  const [value, setValue] = useState(initialValue ?? "")
  const [savedValue, setSavedValue] = useState(initialValue ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const handleSave = async () => {
    if (value === savedValue) {
      onStopEdit()
      return
    }
    setIsSaving(true)
    const result = await onSave(value)
    setIsSaving(false)
    if (result.success) {
      setSavedValue(value)
      onStopEdit()
    }
  }

  const handleCancel = () => {
    setValue(savedValue)
    onStopEdit()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") handleCancel()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          className="bg-white/[0.05] border border-accent/40 text-text-primary text-base font-semibold px-3 py-1 rounded-md focus:outline-none focus:border-accent w-48"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="text-accent hover:text-accent-hover transition-colors"
        >
          <Check size={18} weight="bold" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={18} weight="bold" />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onStartEdit()}
      className="group flex items-center gap-2 hover:text-accent transition-colors"
    >
      <span className={savedValue ? "text-base font-semibold text-text-primary group-hover:text-accent" : "text-sm text-text-muted italic"}>
        {savedValue || emptyLabel}
      </span>
      <Pencil size={12} weight="bold" className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}