"use client"

import { useState, useEffect } from "react"
import {
  ArrowClockwise,
  Users,
  SoccerBall,
  Trophy,
  Lightning,
  CheckCircle,
  Warning,
  Spinner,
} from "@phosphor-icons/react"

// ============================================
// TYPES
// ============================================

type AdminStats = {
  totalUsers: number
  totalPredictions: number
  totalMatchesFinished: number
  totalPlayers: number
}

type AdminUser = {
  id: string
  username: string
  predictionsCount: number
  pronoPoints: number
  goldenBootPoints: number
  bonusPoints: number
  totalPoints: number
}

type ActionStatus = "idle" | "loading" | "success" | "error"

type ActionState = {
  status: ActionStatus
  message: string
}

// ============================================
// COMPOSANT BOUTON D'ACTION
// ============================================

function ActionButton({
  label,
  description,
  icon,
  state,
  onTrigger,
  danger,
}: {
  label: string
  description: string
  icon: React.ReactNode
  state: ActionState
  onTrigger: () => void
  danger?: boolean
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${danger ? "bg-red-500/20" : "bg-accent/10"}`}>
          <span className={danger ? "text-red-400" : "text-accent"}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary">{label}</p>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>
      </div>

      {/* Résultat */}
      {state.status !== "idle" && (
        <div className={`
          text-xs px-3 py-2 rounded-lg flex items-center gap-2
          ${state.status === "success" ? "bg-accent/10 text-accent" : ""}
          ${state.status === "error" ? "bg-red-500/10 text-red-400" : ""}
          ${state.status === "loading" ? "bg-white/5 text-text-muted" : ""}
        `}>
          {state.status === "loading" && <Spinner size={12} className="animate-spin" />}
          {state.status === "success" && <CheckCircle size={12} weight="fill" />}
          {state.status === "error" && <Warning size={12} weight="fill" />}
          <span className="break-words">{state.message}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onTrigger}
        disabled={state.status === "loading"}
        className={`
          w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50
          ${danger
            ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20"
            : "bg-accent text-bg hover:bg-accent-hover"
          }
        `}
      >
        {state.status === "loading" ? "En cours..." : label}
      </button>
    </div>
  )
}

// ============================================
// PAGE ADMIN
// ============================================

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [syncMatchesState, setSyncMatchesState] = useState<ActionState>({ status: "idle", message: "" })
  const [syncPlayersState, setSyncPlayersState] = useState<ActionState>({ status: "idle", message: "" })
  const [goldenBootState, setGoldenBootState] = useState<ActionState>({ status: "idle", message: "" })

  // Ajustement points par userId
  const [bonusInputs, setBonusInputs] = useState<Record<string, string>>({})
  const [savingBonus, setSavingBonus] = useState<Record<string, boolean>>({})

  // ============================================
  // CHARGEMENT DONNÉES
  // ============================================
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoadingData(true)
    try {
      const res = await fetch("/api/admin/data")
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setUsers(data.users)
        // Init les inputs bonus avec les valeurs actuelles
        const inputs: Record<string, string> = {}
        for (const u of data.users) {
          inputs[u.id] = String(u.bonusPoints)
        }
        setBonusInputs(inputs)
      }
    } finally {
      setLoadingData(false)
    }
  }

  // ============================================
  // ACTIONS
  // ============================================

  async function handleSyncMatches() {
    setSyncMatchesState({ status: "loading", message: "Sync en cours..." })
    try {
      const res = await fetch("/api/admin/sync-matches", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        setSyncMatchesState({
          status: "success",
          message: data.log?.length ? data.log.join(" · ") : "Sync terminée.",
        })
        fetchData()
      } else {
        setSyncMatchesState({ status: "error", message: data.error ?? "Erreur inconnue" })
      }
    } catch {
      setSyncMatchesState({ status: "error", message: "Erreur réseau" })
    }
  }

  async function handleSyncPlayers() {
    setSyncPlayersState({ status: "loading", message: "Démarrage sync joueurs (~2 min)..." })
    try {
      const res = await fetch("/api/admin/sync-players", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        setSyncPlayersState({ status: "success", message: data.message })
      } else {
        setSyncPlayersState({ status: "error", message: data.error ?? "Erreur inconnue" })
      }
    } catch {
      setSyncPlayersState({ status: "error", message: "Erreur réseau" })
    }
  }

  async function handleGoldenBoot() {
    setGoldenBootState({ status: "loading", message: "Calcul en cours..." })
    try {
      const res = await fetch("/api/admin/golden-boot", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        setGoldenBootState({
          status: "success",
          message: `${data.usersUpdated} users mis à jour. Top 3 : ${data.top3?.join(", ")}`,
        })
        fetchData()
      } else {
        setGoldenBootState({ status: "error", message: data.error ?? "Erreur inconnue" })
      }
    } catch {
      setGoldenBootState({ status: "error", message: "Erreur réseau" })
    }
  }

  async function handleSaveBonus(userId: string) {
    const value = parseInt(bonusInputs[userId] ?? "0", 10)
    if (isNaN(value)) return

    setSavingBonus((prev) => ({ ...prev, [userId]: true }))
    try {
      const res = await fetch("/api/admin/adjust-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bonusPoints: value }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, bonusPoints: value, totalPoints: u.pronoPoints + u.goldenBootPoints + value }
              : u,
          ),
        )
      }
    } finally {
      setSavingBonus((prev) => ({ ...prev, [userId]: false }))
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="relative bg-dashboard min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Administration
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            Console <span className="text-accent">Admin</span>
          </h1>
        </header>

        {/* ============================================
            STATS
            ============================================ */}
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-4">
            État de la DB
          </h2>
          {loadingData ? (
            <p className="text-text-muted text-sm">Chargement...</p>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Users", value: stats.totalUsers, icon: <Users size={18} /> },
                { label: "Pronos", value: stats.totalPredictions, icon: <Lightning size={18} /> },
                { label: "Matchs joués", value: stats.totalMatchesFinished, icon: <SoccerBall size={18} /> },
                { label: "Joueurs", value: stats.totalPlayers, icon: <Trophy size={18} /> },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2 text-accent">
                    {s.icon}
                    <p className="text-xs uppercase tracking-widest text-text-muted">{s.label}</p>
                  </div>
                  <p className="text-3xl font-black text-text-primary tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* ============================================
            ACTIONS
            ============================================ */}
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-4">
            Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionButton
              label="Sync matches + recalcul points"
              description="Sync saison/équipes/matchs/buteurs depuis Football-Data, puis recalcule tous les points. ~40s."
              icon={<ArrowClockwise size={20} />}
              state={syncMatchesState}
              onTrigger={handleSyncMatches}
            />
            <ActionButton
              label="Sync joueurs"
              description="Récupère les squads des 18 équipes. À faire 1-2x par an (début de saison + mercato janvier). ~2 min."
              icon={<Users size={20} />}
              state={syncPlayersState}
              onTrigger={handleSyncPlayers}
            />
            <ActionButton
              label="Calcul Golden Boot final"
              description="Compare les picks des users avec le top 3 des buteurs en DB. À faire en fin de saison uniquement."
              icon={<Trophy size={20} />}
              state={goldenBootState}
              onTrigger={handleGoldenBoot}
              danger
            />
          </div>
        </section>

        {/* ============================================
            USERS
            ============================================ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-widest text-text-muted">
              Joueurs ({users.length})
            </h2>
            <button
              type="button"
              onClick={fetchData}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <ArrowClockwise size={12} />
              Rafraîchir
            </button>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            {/* Header tableau */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/10 text-[10px] uppercase tracking-widest text-text-muted">
              <div className="col-span-3">Username</div>
              <div className="col-span-1 text-right">Pronos</div>
              <div className="col-span-2 text-right">Pts pronos</div>
              <div className="col-span-2 text-right">Pts Golden Boot</div>
              <div className="col-span-2 text-right">Bonus admin</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Lignes */}
            {loadingData ? (
              <div className="px-4 py-8 text-center text-text-muted text-sm">Chargement...</div>
            ) : users.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted text-sm">Aucun utilisateur</div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/5 last:border-b-0 items-center hover:bg-white/[0.02] transition-colors"
                >
                  {/* Username */}
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-text-primary truncate">{user.username}</p>
                  </div>

                  {/* Nb pronos */}
                  <div className="col-span-1 text-right">
                    <span className="text-sm text-text-muted tabular-nums">{user.predictionsCount}</span>
                  </div>

                  {/* Points pronos */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium text-text-primary tabular-nums">{user.pronoPoints}</span>
                  </div>

                  {/* Points Golden Boot */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium text-text-primary tabular-nums">{user.goldenBootPoints}</span>
                  </div>

                  {/* Bonus admin — champ éditable */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <input
                      type="number"
                      value={bonusInputs[user.id] ?? "0"}
                      onChange={(e) =>
                        setBonusInputs((prev) => ({ ...prev, [user.id]: e.target.value }))
                      }
                      className="w-16 text-right text-sm bg-white/5 border border-white/10 rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveBonus(user.id)}
                      disabled={savingBonus[user.id]}
                      className="text-[10px] bg-accent/10 hover:bg-accent/20 text-accent px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      {savingBonus[user.id] ? "..." : "OK"}
                    </button>
                  </div>

                  {/* Total */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-bold text-accent tabular-nums">
                      {user.totalPoints}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  )
}