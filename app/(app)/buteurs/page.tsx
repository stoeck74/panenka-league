import { auth } from "@/../auth"
import { getButeurs } from "@/lib/buteurs-data"
import { ButeursView } from "@/components/buteurs/ButeursView"

export default async function ButeursPage() {
  const session = await auth()
  if (!session) return null

  const buteurs = await getButeurs()

  return (
    <div className="min-h-screen bg-bg bg-buteurs">
      <ButeursView buteurs={buteurs} />
    </div>
  )
}