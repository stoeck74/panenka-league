"use server"

import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ============================================
// CONSTANTES MÉTIER
// ============================================
const MAX_BANCOS_PER_MATCHDAY = 2
const LOCK_BEFORE_KICKOFF_MS = 60 * 60 * 1000 // 1h

// ============================================
// HELPER — Une matchday est-elle ouverte aux pronos ?
// ============================================
// Règle Panenka : on peut pronostiquer sur une matchday tant que
// le premier match de cette matchday est à plus de 1h dans le futur.
// Si le 1er kickoff est dans moins d'1h (ou passé), tout est lock.
async function isMatchdayOpen(matchdayId: string): Promise<boolean> {
  const firstMatch = await prisma.match.findFirst({
    where: { matchdayId },
    orderBy: { kickoffAt: "asc" },
    select: { kickoffAt: true },
  })
  if (!firstMatch) return false
  const lockTime = firstMatch.kickoffAt.getTime() - LOCK_BEFORE_KICKOFF_MS
  return Date.now() < lockTime
}

// ============================================
// DEV OVERRIDE — bypass du lock si flag actif
// ============================================
// Quand DEV_FORCE_CURRENT_MATCHDAY est set (en dev uniquement),
// on bypasse aussi le lock côté serveur, sinon impossible de sauvegarder.
function devOverrideActive(matchdayNumber: number): boolean {
  if (process.env.NODE_ENV === "production") return false
  const raw = process.env.DEV_FORCE_CURRENT_MATCHDAY
  if (!raw) return false
  return parseInt(raw, 10) === matchdayNumber
}

// ============================================
// SAVE PREDICTION
// ============================================
/**
 * Sauvegarde ou met à jour un prono Panenka.
 *
 * Règles métier :
 * - L'utilisateur doit être connecté
 * - Le match doit exister
 * - La matchday du match doit être encore ouverte (T-1h du 1er kickoff)
 * - Pas de suppression : (0, 0) est un prono valide (match nul prédit)
 *
 * @param matchId   - ID du match (cuid)
 * @param homeScore - Score domicile prédit (>= 0)
 * @param awayScore - Score extérieur prédit (>= 0)
 */
export async function savePrediction(
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  // 1. Auth
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false as const, error: "Non authentifié" }
  }
  const userId = session.user.id

  // 2. Validation basique des inputs
  if (!Number.isInteger(homeScore) || homeScore < 0 || homeScore > 99) {
    return { ok: false as const, error: "Score domicile invalide" }
  }
  if (!Number.isInteger(awayScore) || awayScore < 0 || awayScore > 99) {
    return { ok: false as const, error: "Score extérieur invalide" }
  }

  // 3. Vérif match + matchday
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      matchdayId: true,
      matchday: { select: { number: true } },
    },
  })
  if (!match) {
    return { ok: false as const, error: "Match introuvable" }
  }

  // 4. Matchday ouverte ? (sauf override dev)
  const devBypass = devOverrideActive(match.matchday.number)
  if (!devBypass) {
    const open = await isMatchdayOpen(match.matchdayId)
    if (!open) {
      return { ok: false as const, error: "La journée est verrouillée" }
    }
  }

  // 5. Upsert (on ne touche pas à isBanco ici — c'est l'autre action)
  try {
    await prisma.prediction.upsert({
      where: {
        userId_matchId: { userId, matchId },
      },
      create: {
        userId,
        matchId,
        homeScore,
        awayScore,
      },
      update: {
        homeScore,
        awayScore,
      },
    })

    return { ok: true as const }
  } catch (e) {
    console.error("[savePrediction] failed:", e)
    return { ok: false as const, error: "Erreur lors de l'enregistrement" }
  }
}

// ============================================
// TOGGLE BANCO
// ============================================
/**
 * Active/désactive le banco sur un prono existant.
 *
 * Règles métier :
 * - L'utilisateur doit avoir déjà un prono sur ce match
 * - Maximum 2 bancos par matchday
 * - Lock identique aux pronos (T-1h du 1er match)
 *
 * @param matchId - ID du match
 * @param banco   - true pour activer, false pour désactiver
 */
export async function toggleBanco(matchId: string, banco: boolean) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false as const, error: "Non authentifié" }
  }
  const userId = session.user.id

  // Charger le prono existant + sa matchday
  const prediction = await prisma.prediction.findUnique({
    where: { userId_matchId: { userId, matchId } },
    select: {
      id: true,
      isBanco: true,
      match: {
        select: {
          matchdayId: true,
          matchday: { select: { number: true } },
        },
      },
    },
  })
  if (!prediction) {
    return {
      ok: false as const,
      error: "Aucun prono sur ce match — saisis un score d'abord",
    }
  }

  // Lock check (avec override dev)
  const devBypass = devOverrideActive(prediction.match.matchday.number)
  if (!devBypass) {
    const open = await isMatchdayOpen(prediction.match.matchdayId)
    if (!open) {
      return { ok: false as const, error: "La journée est verrouillée" }
    }
  }

  // Si on active, vérifier la limite des 2 bancos sur cette matchday
  if (banco && !prediction.isBanco) {
    const currentBancoCount = await prisma.prediction.count({
      where: {
        userId,
        isBanco: true,
        match: { matchdayId: prediction.match.matchdayId },
      },
    })
    if (currentBancoCount >= MAX_BANCOS_PER_MATCHDAY) {
      return {
        ok: false as const,
        error: `Maximum ${MAX_BANCOS_PER_MATCHDAY} bancos par journée`,
      }
    }
  }

  try {
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { isBanco: banco },
    })

    return { ok: true as const }
  } catch (e) {
    console.error("[toggleBanco] failed:", e)
    return { ok: false as const, error: "Erreur lors de la mise à jour" }
  }
}