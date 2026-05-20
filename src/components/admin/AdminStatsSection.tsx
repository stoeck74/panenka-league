"use client"

import { useTransition } from "react"
import { recalculateAllPoints } from "@/lib/actions/admin"

type AdminStatsSectionProps = {
  totalUsers: number
  totalAdmins: number
  totalMatches: number
  matchesFinished: number
  matchesLive: number
  totalPredictions: number
}

export function AdminStatsSection({
  totalUsers,
  totalAdmins,
  totalMatches,
  matchesFinished,
  matchesLive,
  totalPredictions,
}: AdminStatsSectionProps) {
  const [isPending, startTransition] = useTransition()

  const handleRecalcAll = () => {
    startTransition(async () => {
      const result = await recalculateAllPoints()
      if (result.ok && "matchesProcessed" in result) {
        alert(`Recalcul OK : ${result.matchesProcessed} matchs, ${result.totalUpdated} pronos`)
      } else {
        alert(`Erreur : ${"error" in result ? result.error : "Inconnue"}`)
      }
    })
  }

  return (
    <section className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-4">Système</h2>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <StatCard label="Users" value={`${totalUsers - totalAdmins}+${totalAdmins}`} sub="users+admins" />
        <StatCard label="Pronos" value={totalPredictions} />
        <StatCard label="Matchs" value={totalMatches} />
        <StatCard label="Joués" value={matchesFinished} />
        <StatCard label="En cours" value={matchesLive} />
        <StatCard label="À venir" value={totalMatches - matchesFinished - matchesLive} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRecalcAll}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isPending ? "Recalcul en cours..." : "Recalculer tous les points"}
        </button>
      </div>
    </section>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/5 p-3">
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <p className="text-xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-[10px] text-text-muted">{sub}</p>}
    </div>
  )
}