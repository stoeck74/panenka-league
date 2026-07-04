// ============================================
// CLASSEMENT DATA
// ============================================
// Récupère le classement de la saison active : tous les users, leurs
// points totaux, leur rang (avec ex-aequo).

import { prisma } from "@/lib/prisma"

export type ClassementEntry = {
  rank: number              // rang affiché (avec ex-aequo : 1, 2, 2, 4)
  userId: string
  username: string
  name: string | null       // displayName optionnel
  avatarUrl: string         // toujours fournie (DiceBear fallback)
  totalPoints: number
  isCurrentUser: boolean    // pour highlighter "moi"
}

/**
 * Construit l'URL d'avatar finale pour un user.
 *   - Si `avatar` (URL custom) est défini → on l'utilise
 *   - Sinon → DiceBear avec style + seed (fallback sur "toon-head" + username)
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
 * Retourne le classement complet de la saison active.
 *
 * Règles :
 *   - Tous les Users, même ceux à 0 points
 *   - Total des points = somme des Prediction.pointsEarned sur les matchs
 *     de la saison active
 *   - Tri : totalPoints DESC, puis username ASC pour stabilité
 *   - Ex-aequo : même rang, rang suivant saute (47, 47, 30 → 1, 1, 3)
 */
export async function getClassement(
  currentUserId?: string,
): Promise<ClassementEntry[]> {
  // 1. Saison active
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!season) return []

  // 2. Tous les users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      avatarStyle: true,
      avatarSeed: true,
      bonusPoints: true,
      goldenBootPoints: true,
    },
  })

  // 3. Total points par user.
  //    On agrège en JS après avoir récupéré les Predictions concernées.
  //    À l'échelle (20 users × 306 matchs max), c'est largement OK.
  const predictions = await prisma.prediction.findMany({
    where: {
      pointsEarned: { not: null },
      match: {
        matchday: { seasonId: season.id },
      },
    },
    select: {
      userId: true,
      pointsEarned: true,
    },
  })

  const pointsByUserId = new Map<string, number>()
  for (const p of predictions) {
    const current = pointsByUserId.get(p.userId) ?? 0
    pointsByUserId.set(p.userId, current + (p.pointsEarned ?? 0))
  }

  // 4. Construction des entries triées
  // Total = pronos + goldenBootPoints + bonusPoints (ajustement admin),
  // pour rester cohérent avec /api/admin/data qui utilise déjà cette formule.
  const sorted = users
    .map((u) => ({
      userId: u.id,
      username: u.username,
      name: u.name,
      avatarUrl: resolveAvatarUrl(u),
      totalPoints:
        (pointsByUserId.get(u.id) ?? 0) + u.goldenBootPoints + u.bonusPoints,
      isCurrentUser: u.id === currentUserId,
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      return a.username.localeCompare(b.username)
    })

  // 5. Attribution des rangs avec ex-aequo
  let lastPoints = -1
  let lastRank = 0
  return sorted.map((entry, index) => {
    let rank: number
    if (entry.totalPoints !== lastPoints) {
      rank = index + 1
      lastRank = rank
      lastPoints = entry.totalPoints
    } else {
      rank = lastRank
    }
    return { ...entry, rank }
  })
}