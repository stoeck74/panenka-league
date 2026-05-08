import { auth } from "@/../auth"
import { fakeJ22Matches, fakeMatchdays } from "@/lib/fake-data/matches"
import { MatchsView } from "@/components/matches/MatchsView"

export default async function MatchsPage() {
  const session = await auth()
  if (!session) return null

  return (
    <MatchsView
      matches={fakeJ22Matches}
      matchdays={fakeMatchdays}
      currentMatchday={22}
    />
  )
}