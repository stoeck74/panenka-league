"use server"

import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ============================================
// GUARD ADMIN
// ============================================

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Non authentifié")
  if (session.user.role !== "ADMIN") throw new Error("Accès refusé")
  return session
}

// ============================================
// STATS GLOBALES
// ============================================

export async function getAdminStats() {
  await requireAdmin()

  const [
    totalUsers,
    totalPredictions,
    totalMatchesFinished,
    totalPlayers,
    totalMatchdays,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.prediction.count(),
    prisma.match.count({ where: { status: "FINISHED" } }),
    prisma.player.count(),
    prisma.matchday.count({ where: { status: "FINISHED" } }),
  ])

  return {
    totalUsers,
    totalPredictions,
    totalMatchesFinished,
    totalPlayers,
    totalMatchdays,
  }
}

// ============================================
// LISTE USERS AVEC STATS
// ============================================

export type AdminUser = {
  id: string
  username: string
  email: string
  role: string
  bonusPoints: number
  goldenBootPoints: number
  predictionsCount: number
  pronoPoints: number
  totalPoints: number
  createdAt: string
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  await requireAdmin()

  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      bonusPoints: true,
      goldenBootPoints: true,
      createdAt: true,
      _count: { select: { predictions: true } },
    },
  })

  // Points pronos par user (saison active)
  const predictions = season
    ? await prisma.prediction.findMany({
        where: {
          pointsEarned: { not: null },
          match: { matchday: { seasonId: season.id } },
        },
        select: { userId: true, pointsEarned: true },
      })
    : []

  const pronoPointsByUser = new Map<string, number>()
  for (const p of predictions) {
    pronoPointsByUser.set(
      p.userId,
      (pronoPointsByUser.get(p.userId) ?? 0) + (p.pointsEarned ?? 0),
    )
  }

  return users.map((u) => {
    const pronoPoints = pronoPointsByUser.get(u.id) ?? 0
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      bonusPoints: u.bonusPoints,
      goldenBootPoints: u.goldenBootPoints,
      predictionsCount: u._count.predictions,
      pronoPoints,
      totalPoints: pronoPoints + u.goldenBootPoints + u.bonusPoints,
      createdAt: u.createdAt.toISOString(),
    }
  })
}

// ============================================
// AJUSTEMENT BONUS POINTS
// ============================================

export async function adjustBonusPoints(
  targetUserId: string,
  delta: number,
) {
  await requireAdmin()

  if (!Number.isInteger(delta) || delta === 0) {
    return { ok: false, error: "Le delta doit être un entier non nul" }
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { username: true, bonusPoints: true },
  })
  if (!user) return { ok: false, error: "User introuvable" }

  const newBonusPoints = user.bonusPoints + delta

  await prisma.user.update({
    where: { id: targetUserId },
    data: { bonusPoints: newBonusPoints },
  })

  revalidatePath("/admin")
  revalidatePath("/classement")
  revalidatePath("/dashboard")

  return {
    ok: true,
    username: user.username,
    previousBonus: user.bonusPoints,
    newBonus: newBonusPoints,
    delta,
  }
}

// ============================================
// RESET BONUS POINTS (remise à 0)
// ============================================

export async function resetBonusPoints(targetUserId: string) {
  await requireAdmin()

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { username: true },
  })
  if (!user) return { ok: false, error: "User introuvable" }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { bonusPoints: 0 },
  })

  revalidatePath("/admin")
  revalidatePath("/classement")

  return { ok: true, username: user.username }
}