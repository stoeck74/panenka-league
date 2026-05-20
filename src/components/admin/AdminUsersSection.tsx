"use client"

import { useTransition } from "react"
import { setUserRole, deleteUser, resetUserPassword } from "@/lib/actions/admin"

type AdminUser = {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
  predictionsCount: number
  totalPoints: number
}

type AdminUsersSectionProps = {
  users: AdminUser[]
  currentUserId: string
}

export function AdminUsersSection({ users, currentUserId }: AdminUsersSectionProps) {
  return (
    <section className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-4">
        Utilisateurs ({users.length})
      </h2>

      <div className="space-y-2">
        {users.map((user) => (
          <AdminUserRow key={user.id} user={user} isMe={user.id === currentUserId} />
        ))}
      </div>
    </section>
  )
}

function AdminUserRow({ user, isMe }: { user: AdminUser; isMe: boolean }) {
  const [isPending, startTransition] = useTransition()

  const createdDate = new Date(user.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })

  const handleToggleRole = () => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN"
    startTransition(async () => {
      const result = await setUserRole(user.id, newRole)
      if (!result.ok) {
        alert(result.error)
      }
    })
  }

  const handleDelete = () => {
    if (!confirm(`Supprimer ${user.username} ?`)) return
    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (!result.ok) {
        alert(result.error)
      }
    })
  }
  const handleResetPassword = () => {
    if (!confirm(`Reset le mot de passe de ${user.username} ?`)) return
    startTransition(async () => {
      const result = await resetUserPassword(user.id)
      if (result.ok && result.tempPassword) {
        prompt(
          `Nouveau mot de passe temporaire pour ${user.username} (à transmettre) :`,
          result.tempPassword
        )
      } else {
        alert("Erreur lors du reset")
      }
    })
  }

  return (
    <div className="rounded-lg bg-black/30 border border-white/5 p-3 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary">{user.username}</span>
          {user.role === "ADMIN" && (
            <span className="text-[10px] uppercase tracking-widest bg-accent/20 text-accent px-2 py-0.5 rounded">
              Admin
            </span>
          )}
          {isMe && (
            <span className="text-[10px] uppercase tracking-widest bg-white/10 text-text-muted px-2 py-0.5 rounded">
              Moi
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate">{user.email}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs text-text-muted">Inscription</p>
        <p className="text-sm text-text-secondary">{createdDate}</p>
      </div>

      <div className="text-right shrink-0 w-16">
        <p className="text-xs text-text-muted">Pronos</p>
        <p className="text-sm font-bold text-text-primary">{user.predictionsCount}</p>
      </div>

      <div className="text-right shrink-0 w-16">
        <p className="text-xs text-text-muted">Points</p>
        <p className="text-sm font-bold text-accent">{user.totalPoints}</p>
      </div>

<div className="flex gap-1 shrink-0">
        {!isMe && (
          <>
            <button
              onClick={handleResetPassword}
              disabled={isPending}
              className="px-2 py-1 rounded bg-white/5 text-text-secondary text-xs hover:bg-white/10 disabled:opacity-50"
              title="Reset password"
            >
              🔑
            </button>
            <button
              onClick={handleToggleRole}
              disabled={isPending}
              className="px-2 py-1 rounded bg-white/5 text-text-secondary text-xs hover:bg-white/10 disabled:opacity-50"
            >
              {user.role === "ADMIN" ? "↓ User" : "↑ Admin"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 disabled:opacity-50"
            >
              Suppr
            </button>
          </>
        )}
      </div>
    </div>
  )
}