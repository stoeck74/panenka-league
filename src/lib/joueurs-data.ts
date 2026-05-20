// ============================================
// JOUEURS DATA
// ============================================
// Liste tous les joueurs Panenka inscrits, triés alphabétiquement.

import { prisma } from "@/lib/prisma"

export type JoueurCard = {
  userId: string
  username: string
  name: string | null          // displayName facultatif
  avatarUrl: string            // toujours fournie (DiceBear fallback)
  favoriteTeam: {
    name: string               // ex: "Olympique de Marseille"
    crestUrl: string | null
  } | null
  favoritePlayer: string | null
  isCurrentUser: boolean
}

/**
 * Construit l'URL d'avatar finale pour un user.
 * Même logique que classement-data.ts pour cohérence.
 */
function resolveAvatarUrl(user: {
  username: string
  avatar: string | null
  avatarStyle: string | null
  avatarSeed: string | null
}): string {
  if (user.avatar) return user.avatar
  const style = user.avatarStyle ?? "toon-head"
  const seed = user.avatarSeed ?? user.username
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

/**
 * Retourne tous les joueurs inscrits, triés alphabétiquement par username.
 *
 * @param currentUserId Optionnel : pour marquer "moi" dans la liste
 */
export async function getJoueurs(currentUserId?: string): Promise<JoueurCard[]> {
  const users = await prisma.user.findMany({
    orderBy: { username: "asc" },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      avatarStyle: true,
      avatarSeed: true,
      favoritePlayer: true,
      favoriteTeam: {
        select: {
          name: true,
          crestUrl: true,
        },
      },
    },
  })

  return users.map((u) => ({
    userId: u.id,
    username: u.username,
    name: u.name,
    avatarUrl: resolveAvatarUrl(u),
    favoriteTeam: u.favoriteTeam,
    favoritePlayer: u.favoritePlayer,
    isCurrentUser: u.id === currentUserId,
  }))
}