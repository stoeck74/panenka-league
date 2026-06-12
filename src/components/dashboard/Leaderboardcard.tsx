import Link from "next/link"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr"
import type { LeaderboardEntry } from "@/lib/dashboard-data"

type LeaderboardCardProps = {
  leaderboardTop: LeaderboardEntry[]
}

export function LeaderboardCard({ leaderboardTop }: LeaderboardCardProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
            Classement
          </p>
          <h3 className="text-xl font-bold text-text-primary">
            Top de la League
          </h3>
        </div>
        <Link
          href="/classement"
          className="text-sm text-accent hover:underline flex items-center gap-1"
        >
          Voir tout
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

      <div className="space-y-2">
        {leaderboardTop.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            Aucun joueur encore
          </p>
        ) : (
          leaderboardTop.map((player) => {
            const avatarStyle = player.avatarStyle ?? "toon-head"
            const avatarSeed = player.avatarSeed ?? player.username
            const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`

            return (
              <Link
                key={`${player.position}-${player.username}`}
                href={`/joueurs/${player.username}`}
                className={`
                  flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors
                  ${player.isMe
                    ? "bg-accent/10 border border-accent/20"
                    : "hover:bg-white/[0.05]"
                  }
                `}
              >
                <span className={`
                  text-sm font-bold w-6 shrink-0 tabular-nums
                  ${player.isMe ? "text-accent" : "text-text-muted"}
                `}>
                  {player.position}.
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt={player.username}
                  className="w-8 h-8 rounded-full bg-accent/30 border border-white/10 shrink-0"
                />
                <span className={`
                  flex-1 text-sm font-medium truncate
                  ${player.isMe ? "text-text-primary" : "text-text-secondary"}
                `}>
                  {player.username}
                </span>
                <span className={`
                  text-sm font-bold shrink-0 tabular-nums
                  ${player.isMe ? "text-accent" : "text-text-primary"}
                `}>
                  {player.points}
                  <span className="text-text-muted text-xs font-normal ml-1">pts</span>
                </span>
              </Link>
            )
          })
        )}
      </div>
    </>
  )
}