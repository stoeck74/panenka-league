import type { RecentFormResult } from "@/lib/dashboard-data"

// ============================================
// RECENT FORM DOTS — 5 derniers résultats
// ============================================
// Composant serveur, purement visuel : un rond vert par prono qui a
// rapporté des points, un rond rouge pour un prono à 0 (ou pénalité
// banco). Visible sur le profil de n'importe quel user, par tout le
// monde (pas de check isOwnProfile ici : c'est volontairement public).
//
// S'il y a moins de 5 pronos jugés (début de saison, nouveau joueur...),
// les emplacements manquants sont affichés en gris pour garder une
// grille de 5 ronds stable.

type Props = {
  results: RecentFormResult[]
  limit?: number
}

export function RecentFormDots({ results, limit = 5 }: Props) {
  const slots = Array.from({ length: limit }, (_, i) => results[i] ?? null)

  return (
    <div className="flex items-center gap-3">
      <p className="text-xs uppercase tracking-widest text-text-muted shrink-0">
        Forme récente
      </p>
      <div className="flex items-center gap-1.5">
        {slots.map((r, i) => (
          <span
            key={r?.matchId ?? `empty-${i}`}
            title={
              r
                ? `J${r.matchdayNumber} — ${r.homeTeamTla} ${r.homeScore ?? "?"}-${r.awayScore ?? "?"} ${r.awayTeamTla} · ${r.points > 0 ? `+${r.points}` : r.points} pt${Math.abs(r.points) > 1 ? "s" : ""}`
                : "Pas encore de résultat"
            }
            className={`w-3 h-3 rounded-full shrink-0 ${
              r === null
                ? "bg-white/10"
                : r.result === "good"
                  ? "bg-accent"
                  : "bg-red-500"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
