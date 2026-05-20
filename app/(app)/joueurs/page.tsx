import { auth } from "@/../auth"
import { getJoueurs } from "@/lib/joueurs-data"
import { JoueursList } from "@/components/joueurs/JoueursList"

export default async function JoueursPage() {
  const session = await auth()
  if (!session) return null

  const joueurs = await getJoueurs(session.user?.id)

  return (
    <div className="min-h-screen bg-bg bg-joueurs">
      <JoueursList joueurs={joueurs} />
    </div>
  )
}