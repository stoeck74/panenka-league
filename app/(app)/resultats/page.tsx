import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"
import { getResultatsPageData } from "@/lib/resultats-data"
import { ResultatsView } from "@/components/resultats/ResultatsView"

export default async function ResultatsPage() {
  const session = await auth()
  if (!session) return null

  // Récupérer l'équipe favorite de l'utilisateur pour highlight
  const user = session.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { favoriteTeamId: true },
      })
    : null

  const data = await getResultatsPageData(user?.favoriteTeamId)

  if (!data) {
    return (
      <div className="min-h-screen flex bg-bg bg-resultats">
        <p className="text-text-muted">
          Aucune saison active.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg bg-resultats">
      <ResultatsView data={data} />
    </div>
  )
}