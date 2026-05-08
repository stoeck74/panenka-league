"use client"

import { useState } from "react"
import { Minus, Plus } from "@phosphor-icons/react"

type ScoreInputProps = {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
  max?: number
}

export function ScoreInput({
  value,
  onChange,
  disabled = false,
  max = 9,
}: ScoreInputProps) {
  const [isHovered, setIsHovered] = useState(false)
  const displayValue = value ?? 0

  const increment = () => {
    if (disabled) return
    if (displayValue < max) {
      onChange(displayValue + 1)
    }
  }

  const decrement = () => {
    if (disabled) return
    if (displayValue > 0) {
      onChange(displayValue - 1)
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative flex items-center justify-center gap-4 select-none
        ${disabled ? "opacity-50" : ""}
      `}
    >
      {/* Bouton − */}
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || displayValue === 0}
        className={`
          flex items-center justify-center w-6 h-6
          transition-all duration-200
          ${isHovered && !disabled ? "opacity-100 text-accent" : "opacity-0 text-text-muted"}
          ${displayValue === 0 ? "pointer-events-none" : "hover:scale-110 cursor-pointer"}
        `}
        aria-label="Décrémenter"
      >
        <Minus size={16} weight="bold" />
      </button>

      {/* Le chiffre */}
      <span
        className={`
          text-3xl md:text-4xl font-black leading-none tabular-nums
          transition-colors duration-200
          ${value === null ? "text-text-muted" : "text-text-primary"}
        `}
      >
        {displayValue}
      </span>

      {/* Bouton + */}
      <button
        type="button"
        onClick={increment}
        disabled={disabled || displayValue >= max}
        className={`
          flex items-center justify-center w-6 h-6
          transition-all duration-200
          ${isHovered && !disabled ? "opacity-100 text-accent" : "opacity-0 text-text-muted"}
          ${displayValue >= max ? "pointer-events-none" : "hover:scale-110 cursor-pointer"}
        `}
        aria-label="Incrémenter"
      >
        <Plus size={16} weight="bold" />
      </button>
    </div>
  )
}