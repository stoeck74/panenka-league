import { auth } from "@/../auth"
import { getClassement } from "@/lib/classement-data"
import { ClassementView } from "@/components/classement/ClassementView"

export default async function ClassementPage() {
  const session = await auth()
  if (!session) return null

  const entries = await getClassement(session.user?.id)

  return (
    <div className="min-h-screen bg-bg">
      <ClassementView entries={entries} />
    </div>
  )
}