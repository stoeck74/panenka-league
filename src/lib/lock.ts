// ============================================
// VERROU DES PRONOS — source de vérité unique
// ============================================
// Règle Panenka : une journée se verrouille à T-1h du coup d'envoi
// du PREMIER match de la journée. Passé ce délai, plus aucun prono
// (ni saisie, ni effacement, ni banco) n'est accepté.
//
// Ce module est volontairement pur et sans dépendance (pas de Prisma,
// pas de Next) pour être importable AUSSI BIEN côté serveur (server
// actions, data layer) que côté client (composants "use client").
// Client et serveur lisent ainsi exactement la même règle.
//
// IMPORTANT : le verrou se calcule sur `kickoffAt` (donnée calendrier
// figée, synchronisée des mois à l'avance), PAS sur le statut du match.
// Il ne dépend donc d'aucune sync API temps réel pour fonctionner.

export const LOCK_BEFORE_KICKOFF_MS = 60 * 60 * 1000 // 1h

/**
 * Instant exact de verrouillage d'une journée à partir du coup d'envoi
 * de son premier match.
 */
export function getLockAt(firstKickoffAt: Date): Date {
  return new Date(firstKickoffAt.getTime() - LOCK_BEFORE_KICKOFF_MS)
}

/**
 * La journée est-elle déjà verrouillée à l'instant `at` (défaut : maintenant) ?
 *
 * @param firstKickoffAt - Coup d'envoi du premier match de la journée
 * @param at             - Instant de référence (ms epoch ou Date)
 */
export function isLockedAt(
  firstKickoffAt: Date,
  at: number | Date = Date.now(),
): boolean {
  const ref = typeof at === "number" ? at : at.getTime()
  return ref >= getLockAt(firstKickoffAt).getTime()
}