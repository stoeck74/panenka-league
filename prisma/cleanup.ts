import "dotenv/config"
import { prisma } from "../src/lib/prisma"

// ============================================
// CLEANUP — pronos de test liés à une saison qui n'est plus active
// ============================================
// Contexte : des pronos de test ont été passés pendant le dev contre les
// matchs (déjà terminés) d'une ancienne saison synchronisée pour tester
// le moteur de points. Ce script les identifie et les supprime.
//
// Sécurité : DRY-RUN par défaut (affiche ce qui serait supprimé, ne
// supprime rien). Relancer avec --confirm pour supprimer réellement.
//
// Usage :
//   npx tsx prisma/cleanup-old-season-predictions.ts            (dry-run)
//   npx tsx prisma/cleanup-old-season-predictions.ts --confirm  (suppression réelle)

async function main() {
  const confirm = process.argv.includes("--confirm")

  const activeSeason = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  })

  if (!activeSeason) {
    console.log("❌ Aucune saison active trouvée. Rien à faire (vérifie ta DB).")
    return
  }

  console.log(`Saison active : ${activeSeason.name} (${activeSeason.id})\n`)

  // Tous les pronos dont le match appartient à une AUTRE saison
  const toDelete = await prisma.prediction.findMany({
    where: {
      match: {
        matchday: {
          seasonId: { not: activeSeason.id },
        },
      },
    },
    select: {
      id: true,
      userId: true,
      homeScore: true,
      awayScore: true,
      pointsEarned: true,
      createdAt: true,
      match: {
        select: {
          kickoffAt: true,
          matchday: { select: { season: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  if (toDelete.length === 0) {
    console.log("✅ Aucun prono lié à une ancienne saison. Rien à nettoyer.")
    return
  }

  console.log(`${toDelete.length} prono(s) trouvé(s), liés à une saison différente de l'active :\n`)
  for (const p of toDelete) {
    console.log(
      `  - ${p.id} | user ${p.userId} | ${p.homeScore}-${p.awayScore} | ` +
        `pts=${p.pointsEarned ?? "—"} | saison "${p.match.matchday.season.name}" | ` +
        `créé le ${p.createdAt.toISOString().slice(0, 10)}`,
    )
  }

  if (!confirm) {
    console.log(
      `\n🔍 DRY-RUN — rien n'a été supprimé. Relance avec --confirm pour supprimer ces ${toDelete.length} pronos.`,
    )
    return
  }

  const result = await prisma.prediction.deleteMany({
    where: { id: { in: toDelete.map((p) => p.id) } },
  })

  console.log(`\n✅ ${result.count} prono(s) supprimé(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())