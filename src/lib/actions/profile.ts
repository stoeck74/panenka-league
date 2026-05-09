"use server"

import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateFavoritePlayer(value: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  const trimmed = value.trim().slice(0, 50)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { favoritePlayer: trimmed || null },
  })

  revalidatePath(`/joueurs/${session.user.username}`)
  return { success: true }
}

export async function updateFavoriteTeam(teamId: string | null) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { favoriteTeamId: teamId },
  })

  revalidatePath(`/joueurs/${session.user.username}`)
  return { success: true }
}

export async function updateAvatar(style: string, seed: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  // Validation : seuls 2 styles acceptés
  if (!["toon-head", "personas"].includes(style)) {
    return { error: "Style invalide" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      avatarStyle: style,
      avatarSeed: seed,
    },
  })

  revalidatePath(`/joueurs/${session.user.username}`)
  return { success: true }
}