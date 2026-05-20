import { auth } from "@/../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminMatchesSection } from "@/components/admin/AdminMatchesSection"
import { AdminUsersSection } from "@/components/admin/AdminUsersSection"
import { AdminStatsSection } from "@/components/admin/AdminStatsSection"
import { recalculateAllPoints } from "@/lib/actions/admin"

export default async function AdminPage() {
  const session = await auth()

  // Protection serveur
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  // ============================================
  // CHARGER LES DONNÉES
  // ============================================
  const [users, matches, stats] = await Promise.all([
    prisma.user.findMany({
      include: {
        _count: { select: { predictions: true } },
        predictions: { select: { pointsEarned: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoffAt: "asc" },
    }),
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.match.count(),
      prisma.match.count({ where: { status: "FINISHED" } }),
      prisma.match.count({ where: { status: "LIVE" } }),
      prisma.prediction.count(),
    ]),
  ])

  const [
    totalUsers,
    totalAdmins,
    totalMatches,
    matchesFinished,
    matchesLive,
    totalPredictions,
  ] = stats

  // Calcule les points totaux par user
  const usersWithPoints = users.map((u) => ({
    ...u,
    totalPoints: u.predictions.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0),
  }))

  // Map les matchs pour passage en props serializable
  const serializedMatches = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    group: m.group,
    status: m.status,
    homeTeam: m.homeTeam ? { name: m.homeTeam.name, tla: m.homeTeam.tla } : null,
    awayTeam: m.awayTeam ? { name: m.awayTeam.name, tla: m.awayTeam.tla } : null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homePenalties: m.homePenalties,
    awayPenalties: m.awayPenalties,
    kickoffAt: m.kickoffAt.toISOString(),
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-neutral-950">
      <div className="max-w-[1400px] mx-auto">

        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Administration
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            Console <span className="text-accent">admin</span>
          </h1>
          <p className="text-text-secondary mt-1">
            Gestion du tournoi · {totalUsers} users · {totalPredictions} pronos
          </p>
        </header>

        <div className="space-y-8">
          <AdminStatsSection
            totalUsers={totalUsers}
            totalAdmins={totalAdmins}
            totalMatches={totalMatches}
            matchesFinished={matchesFinished}
            matchesLive={matchesLive}
            totalPredictions={totalPredictions}
          />

          <AdminMatchesSection matches={serializedMatches} />

          <AdminUsersSection users={usersWithPoints.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt.toISOString(),
            predictionsCount: u._count.predictions,
            totalPoints: u.totalPoints,
          }))} currentUserId={session.user.id} />
        </div>

      </div>
    </div>
  )
}