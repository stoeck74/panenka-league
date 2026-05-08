import { auth } from "@/../auth"
import { logoutAction } from "@/lib/actions/auth"

export default async function DashboardPage() {
  const session = await auth()
  
  // Pas besoin de check session, le layout (app) le fait déjà
  // Mais TypeScript ne le sait pas, donc on garde un fallback
  if (!session) return null

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">
        Bienvenue {session.user.username}
      </h1>
      <p className="text-text-secondary mb-8">
        Tu es connecté à Panenka League.
      </p>
      <p className="text-sm text-text-muted mb-8">
        Email : {session.user.email}<br />
        Rôle : {session.user.role}
      </p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="bg-danger/20 border border-danger/40 text-danger px-6 py-2 rounded-lg hover:bg-danger/30 transition-colors"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  )
}