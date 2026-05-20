import { auth } from "@/../auth"
import { MatchsView } from "@/components/matches/MatchsView"
import { getMatchsPageData } from "@/lib/matches-data"

export default async function MatchsPage() {
  const session = await auth()
  if (!session) return null

  const data = await getMatchsPageData(session.user?.id)

  if (!data) {
    return (
      <div className="min-h-screen flex  bg-matches w-full ">
        <p className="text-text-muted">
          Aucune saison active. Lance la sync pour démarrer.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-matches w-full ">
      <MatchsView
        matches={data.matches}
        matchdays={data.matchdays}
        currentMatchday={data.currentMatchday}
      />
    </div>
  )
}