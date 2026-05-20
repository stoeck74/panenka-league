"use server"

import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculatePointsForMatch, calculateAllPoints } from "./points"

// ============================================
// HELPER : vérifie que l'user est admin
// ============================================
async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Accès admin requis")
  }
  return session
}

// ============================================
// ACTIONS MATCHS
// ============================================

/**
 * Édite le score d'un match et passe en FINISHED.
 * Recalcule automatiquement les points des pronos.
 */
export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  homePenalties: number | null = null,
  awayPenalties: number | null = null
) {
  await requireAdmin()

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      homePenalties,
      awayPenalties,
      status: "FINISHED",
    },
  })

  // Recalcule les points pour ce match
  await calculatePointsForMatch(matchId)

  revalidatePath("/admin")
  return { ok: true }
}

/**
 * Reset un match à SCHEDULED (annule un FINISHED).
 */
export async function resetMatch(matchId: string) {
  await requireAdmin()

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: null,
      awayScore: null,
      homePenalties: null,
      awayPenalties: null,
      status: "SCHEDULED",
    },
  })

  // Reset les points des pronos de ce match
  await prisma.prediction.updateMany({
    where: { matchId },
    data: { pointsEarned: null },
  })

  revalidatePath("/admin")
  return { ok: true }
}

/**
 * Recalcule les points d'un match (sans toucher au score).
 */
export async function recalculateMatchPoints(matchId: string) {
  await requireAdmin()
  const result = await calculatePointsForMatch(matchId)
  revalidatePath("/admin")
  return result
}

/**
 * Recalcule TOUS les points de TOUS les matchs FINISHED.
 */
export async function recalculateAllPoints() {
  await requireAdmin()
  const result = await calculateAllPoints()
  revalidatePath("/admin")
  return result
}

// ============================================
// ACTIONS USERS
// ============================================

/**
 * Change le rôle d'un user.
 */
export async function setUserRole(userId: string, role: "USER" | "ADMIN") {
  const session = await requireAdmin()

  // Empêche l'admin de se rétrograder lui-même
  if (userId === session.user.id && role === "USER") {
    return { ok: false, error: "Tu ne peux pas te rétrograder toi-même" }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath("/admin")
  return { ok: true }
}

/**
 * Supprime un user (et tous ses pronos en cascade).
 */
export async function deleteUser(userId: string) {
  const session = await requireAdmin()

  if (userId === session.user.id) {
    return { ok: false, error: "Tu ne peux pas te supprimer toi-même" }
  }

  await prisma.user.delete({
    where: { id: userId },
  })

  revalidatePath("/admin")
  return { ok: true }
}

// ============================================
// ACTION SYNC API
// ============================================

/**
 * Trigger la sync API manuellement.
 * Pour l'instant on retourne juste un message — la vraie sync sera implémentée
 * dans la prochaine étape avec un endpoint séparé.
 */
export async function triggerSync() {
  await requireAdmin()
  // TODO: appeler le route handler /api/sync-matches
  return { ok: false, error: "Sync auto pas encore implémentée. Lance npx tsx prisma/sync-matches.ts en local." }
}

import bcrypt from "bcryptjs"

/**
 * Reset le mot de passe d'un user à une valeur temporaire.
 * Retourne le nouveau mot de passe pour que l'admin puisse le transmettre.
 */
export async function resetUserPassword(userId: string) {
  await requireAdmin()

  // Génère un mot de passe temporaire de 10 caractères
  const tempPassword = Math.random().toString(36).slice(-10)
  const hashed = await bcrypt.hash(tempPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  })

  return { ok: true, tempPassword }
}