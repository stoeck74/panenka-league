"use server"

import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { isLockedAt } from "@/lib/lock"

// ============================================
// LOCK — T-1h avant le 1er match de J1
// ============================================
async function isGoldenBootLocked(): Promise<boolean> {
  // Override dev : jamais verrouillé en développement
  if (process.env.NODE_ENV !== "production") return false

  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return true

  const firstMatch = await prisma.match.findFirst({
    where: { matchday: { seasonId: season.id } },
    orderBy: { kickoffAt: "asc" },
    select: { kickoffAt: true },
  })
  if (!firstMatch) return false

  return isLockedAt(firstMatch.kickoffAt)
}

// ============================================
// SAVE
// ============================================
export async function saveGoldenBootPredictions(
  player1Id: string | null,
  player2Id: string | null,
  player3Id: string | null,
) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Non authentifié" }

  if (await isGoldenBootLocked()) {
    return { ok: false, error: "Les pronos Golden Boot sont verrouillés" }
  }

  // Pas de doublons
  const ids = [player1Id, player2Id, player3Id].filter(Boolean) as string[]
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: "Tu ne peux pas choisir 2 fois le même joueur" }
  }

  // Vérifie existence en DB
  if (ids.length > 0) {
    const found = await prisma.player.count({ where: { id: { in: ids } } })
    if (found !== ids.length) {
      return { ok: false, error: "Un ou plusieurs joueurs sont introuvables" }
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      goldenBoot1stPlayerId: player1Id,
      goldenBoot2ndPlayerId: player2Id,
      goldenBoot3rdPlayerId: player3Id,
    },
  })

  revalidatePath("/dashboard")
  revalidatePath(`/joueurs/${session.user.username}`)

  return { ok: true }
}

// ============================================
// SEARCH — Midfield + Offence uniquement
// ============================================
export async function searchPlayers(query: string) {
  if (!query || query.trim().length < 2) return { ok: true, players: [] }

  const players = await prisma.player.findMany({
    where: {
      name: { contains: query.trim(), mode: "insensitive" },

    },
    select: {
      id: true,
      name: true,
      position: true,
      nationality: true,
      photoUrl: true,
      team: { select: { name: true, tla: true, crestUrl: true } },
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    take: 20,
  })

  return { ok: true, players }
}

// ============================================
// GET STATUS (pour la card)
// ============================================
export async function getGoldenBootStatus() {
  return { locked: await isGoldenBootLocked() }
}

// ============================================
// GET USER PICKS (pour profil public)
// ============================================
export async function getUserGoldenBootPredictions(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      goldenBoot1stPlayer: {
        select: {
          id: true, name: true, position: true, nationality: true, photoUrl: true,
          team: { select: { name: true, tla: true, crestUrl: true } },
        },
      },
      goldenBoot2ndPlayer: {
        select: {
          id: true, name: true, position: true, nationality: true, photoUrl: true,
          team: { select: { name: true, tla: true, crestUrl: true } },
        },
      },
      goldenBoot3rdPlayer: {
        select: {
          id: true, name: true, position: true, nationality: true, photoUrl: true,
          team: { select: { name: true, tla: true, crestUrl: true } },
        },
      },
    },
  })
  if (!user) return { ok: false, error: "User introuvable" }
  return {
    ok: true,
    predictions: {
      first: user.goldenBoot1stPlayer,
      second: user.goldenBoot2ndPlayer,
      third: user.goldenBoot3rdPlayer,
    },
  }
}