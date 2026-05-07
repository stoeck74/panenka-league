import { auth } from "@/../auth"
import { logoutAction } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Bienvenue {session.user.username} ! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Tu es connecté à Panenka League.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Email : {session.user.email}<br />
          Rôle : {session.user.role}
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  )
}