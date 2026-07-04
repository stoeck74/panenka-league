import { prisma } from "@/lib/prisma"

// ============================================
// GOLDEN BOOT — Matching Scorer → Player
// ============================================
// On reçoit les tops buteurs (Scorer, endpoint "scorers" de football-data)
// et on doit retrouver le Player correspondant (endpoint "squad", utilisé
// pour l'autocomplete Golden Boot) pour créditer les points. Les deux
// endpoints ne donnent pas toujours le nom exactement de la même façon
// (accents, initiale vs prénom complet, espaces...), donc un match
// "égalité stricte insensible à la casse" peut rater un joueur pourtant
// bien présent en DB — et donc faire perdre des points à un user qui
// avait pourtant fait le bon pick.
//
// Stratégie : 1) égalité stricte (rapide, cas normal)
//             2) fallback sur un nom normalisé (accents retirés, espaces
//                multiples réduits, casse ignorée) si le 1er échoue.
//
// Utilisé à la fois par /api/admin/golden-boot et par le script de fin de
// saison prisma/recalculate-golden-boot.ts, pour éviter que les deux
// dérivent avec des règles différentes.

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .replace(/[^a-zA-Z0-9\s]/g, " ") // ponctuation → espace (points, tirets...)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export async function findPlayerIdForScorer(
  scorerName: string,
  teamId: string,
): Promise<string | null> {
  // 1. Égalité stricte insensible à la casse (rapide, cas normal)
  const exact = await prisma.player.findFirst({
    where: { name: { equals: scorerName, mode: "insensitive" }, teamId },
    select: { id: true },
  })
  if (exact) return exact.id

  // 2. Fallback : comparaison sur nom normalisé parmi les joueurs de l'équipe
  const squadPlayers = await prisma.player.findMany({
    where: { teamId },
    select: { id: true, name: true },
  })
  const normalizedTarget = normalizeName(scorerName)
  const fuzzyMatch = squadPlayers.find(
    (p) => normalizeName(p.name) === normalizedTarget,
  )
  if (fuzzyMatch) {
    console.warn(
      `[golden-boot] Match fuzzy utilisé pour "${scorerName}" → "${fuzzyMatch.name}"`,
    )
    return fuzzyMatch.id
  }

  return null
}
