"use client"

import { useState, useRef, useEffect, useMemo, useTransition } from "react"
import { gsap } from "gsap"
import { Lightning, ClockCountdown } from "@phosphor-icons/react"
import { toast } from "sonner"
import { MatchCard } from "./MatchCard"
import type { ViewMatch, ViewMatchday } from "@/lib/matches-data"
import { savePrediction, toggleBanco } from "@/lib/actions/predictions"

type MatchsViewProps = {
  matches: ViewMatch[]
  matchdays: ViewMatchday[]
  currentMatchday: number
}

const MAX_BANCOS = 2

export function MatchsView({
  matches,
  matchdays,
  currentMatchday,
}: MatchsViewProps) {
  const [selectedMatchday, setSelectedMatchday] = useState(currentMatchday)
  const [, startTransition] = useTransition()

  type MatchdayStatus = "past" | "current" | "future"

  const selectedMatchdayInfo = matchdays.find((md) => md.number === selectedMatchday)
  const matchdayStatus: MatchdayStatus = selectedMatchdayInfo?.status ?? "future"

  const displayedMatches = useMemo(
    () => matches.filter((m) => m.matchdayNumber === selectedMatchday),
    [matches, selectedMatchday]
  )

  // ============================================
  // STATE GLOBAL DES PRONOS ET BANCOS
  // ============================================
  // Initialisé depuis la prop `matches` (qui contient les pronos serveur).
  // À chaque modif, on optimistic-update le state puis on call la server
  // action. Si elle fail, on rollback.
  const [bancoIds, setBancoIds] = useState<Set<string>>(new Set())
  const [predictions, setPredictions] = useState<
    Map<string, { home: number | null; away: number | null }>
  >(new Map())

 // Hydrate les pronos depuis les props pour les matchs qu'on ne connaît PAS encore.
  // Si on a déjà saisi un prono pendant la session, on garde notre state local.
  useEffect(() => {
    setBancoIds((prevBancoIds) => {
      const next = new Set(prevBancoIds)
      displayedMatches.forEach((m) => {
        // Initialise depuis les props seulement si le match n'est pas déjà connu localement
        if (!prevBancoIds.has(m.id) && m.isBanco) {
          next.add(m.id)
        }
      })
      return next
    })

    setPredictions((prevPredictions) => {
      const next = new Map(prevPredictions)
      displayedMatches.forEach((m) => {
        if (!prevPredictions.has(m.id)) {
          next.set(m.id, {
            home: m.myHomePrediction ?? null,
            away: m.myAwayPrediction ?? null,
          })
        }
      })
      return next
    })
  }, [displayedMatches])

  // Refs animations GSAP
  const headerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  // ============================================
  // STATS
  // ============================================
 // Bancos pour la journée affichée uniquement (le state local agrège toutes les journées)
  const bancosOnSelectedMatchday = useMemo(() => {
    const displayedIds = new Set(displayedMatches.map((m) => m.id))
    let count = 0
    bancoIds.forEach((id) => {
      if (displayedIds.has(id)) count++
    })
    return count
  }, [bancoIds, displayedMatches])

  const stats = useMemo(() => {
    const total = displayedMatches.length
    let predictionsMade = 0
    displayedMatches.forEach((m) => {
      const p = predictions.get(m.id)
      if (p && p.home !== null && p.away !== null) predictionsMade++
    })
    return {
      total,
      predictionsMade,
      bancosUsed: bancosOnSelectedMatchday,
      maxBancos: MAX_BANCOS,
    }
  }, [predictions, bancosOnSelectedMatchday, displayedMatches])

// ============================================
  // HANDLER PRONO : optimistic update + debounced save + rollback si erreur
  // ============================================
  // Map matchId → timeout ID pour pouvoir annuler le save précédent quand
  // l'utilisateur continue de taper.
  const saveTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const handlePredictionChange = (
    matchId: string,
    home: number | null,
    away: number | null
  ) => {
    // Optimistic : mise à jour immédiate du state local
    const previous = predictions.get(matchId) ?? { home: null, away: null }
    setPredictions((prev) => {
      const next = new Map(prev)
      next.set(matchId, { home, away })
      return next
    })

    // Pas de save si l'un des côtés est null
    if (home === null || away === null) return

    // Annule un éventuel save précédent en attente pour ce match
    const previousTimer = saveTimersRef.current.get(matchId)
    if (previousTimer) clearTimeout(previousTimer)

    // Programme un nouveau save dans 500ms (= si l'utilisateur arrête de taper)
    const timer = setTimeout(() => {
      saveTimersRef.current.delete(matchId)
      startTransition(async () => {
        const result = await savePrediction(matchId, home, away)
        if (!result.ok) {
          setPredictions((prev) => {
            const next = new Map(prev)
            next.set(matchId, previous)
            return next
          })
          toast.error(result.error ?? "Impossible de sauvegarder")
        } else {
          toast.success("Prono enregistré")
        }
      })
    }, 500)

    saveTimersRef.current.set(matchId, timer)
  }

  // ============================================
  // HANDLER BANCO : optimistic update + server action + rollback
  // ============================================
  const handleBancoToggle = (matchId: string) => {
    const wasBanco = bancoIds.has(matchId)
    const willBeBanco = !wasBanco

    // Limite côté UI (server check aussi)
    if (willBeBanco && bancoIds.size >= MAX_BANCOS) {
      toast.error(`Maximum ${MAX_BANCOS} bancos par journée`)
      return
    }

    // Optimistic
    setBancoIds((prev) => {
      const next = new Set(prev)
      if (willBeBanco) next.add(matchId)
      else next.delete(matchId)
      return next
    })

    startTransition(async () => {
      const result = await toggleBanco(matchId, willBeBanco)
      if (!result.ok) {
        // Rollback
        setBancoIds((prev) => {
          const next = new Set(prev)
          if (wasBanco) next.add(matchId)
          else next.delete(matchId)
          return next
        })
        toast.error(result.error ?? "Impossible de basculer le banco")
      } else {
        toast.success(willBeBanco ? "Banco activé" : "Banco désactivé")
      }
    })
  }

  // ============================================
  // ANIMATION GSAP — Entrée stagger
  // ============================================
  useEffect(() => {
    const header = headerRef.current
    const tabs = tabsRef.current
    const cards = cardsRef.current

    if (!header || !tabs || !cards) return

    const elements = [header, tabs, ...cards.children]

    gsap.set(elements, { opacity: 0, y: 24 })

    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: "power3.out",
      delay: 0.1,
    })
  }, [selectedMatchday])

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">


        <header ref={headerRef} className="mb-8">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Pronostics
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                Journée <span className="text-accent">{selectedMatchday}</span>
              </h1>
              <p className="text-text-secondary mt-1">
                Compose tes pronos avant le coup d&apos;envoi
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
                  Pronos
                </p>
                <p className="text-2xl font-black text-text-primary">
                  {stats.predictionsMade}
                  <span className="text-text-muted text-base font-normal ml-1">
                    / {stats.total}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1">
                  <Lightning size={12} weight="fill" />
                  Bancos
                </p>
                <p className="text-2xl font-black text-accent">
                  {stats.bancosUsed}
                  <span className="text-text-muted text-base font-normal ml-1">
                    / {stats.maxBancos}
                  </span>
                </p>
              </div>

              <div className="hidden lg:block">
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1">
                  <ClockCountdown size={12} weight="bold" />
                  Coup d&apos;envoi
                </p>
                <p className="text-2xl font-black text-text-primary tabular-nums">
                  2j 14h
                </p>
              </div>
            </div>
          </div>
        </header>

        <div ref={tabsRef} className="mb-8 -mx-4 md:mx-0">
          <div className="flex gap-2 overflow-x-auto pb-2 px-4 md:px-0 scrollbar-hide">
            {matchdays.map((md) => (
              <button
                key={md.number}
                type="button"
                onClick={() => setSelectedMatchday(md.number)}
                className={`
                  shrink-0 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all
                  ${selectedMatchday === md.number
                    ? "bg-accent text-bg"
                    : "bg-white/[0.03] border border-white/10 text-text-secondary hover:bg-white/[0.06] hover:text-text-primary"
                  }
                `}
              >
                Journée {md.number}
                {md.status === "current" && selectedMatchday !== md.number && (
                  <span className="ml-2 inline-block w-1.5 h-1.5 bg-accent rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {displayedMatches.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-12 text-center text-text-muted">
              Aucun match disponible pour cette journée
            </div>
          ) : (
            displayedMatches.map((match) => {
              const prediction = predictions.get(match.id) ?? { home: null, away: null }
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  homePrediction={prediction.home}
                  awayPrediction={prediction.away}
                  isBanco={bancoIds.has(match.id)}
                  bancoLimitReached={bancosOnSelectedMatchday >= MAX_BANCOS && !bancoIds.has(match.id)}
                  matchdayStatus={matchdayStatus}
                  onPredictionChange={handlePredictionChange}
                  onBancoToggle={handleBancoToggle}
                />
              )
            })
          )}
        </div>

      </div>

  )
}