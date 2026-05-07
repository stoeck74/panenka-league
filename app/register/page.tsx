import { registerAction } from "@/lib/actions/auth"
import Link from "next/link"

const errorMessages: Record<string, string> = {
  missing: "Tous les champs sont obligatoires",
  password_short: "Le mot de passe doit faire au moins 8 caractères",
  username_short: "Le pseudo doit faire au moins 3 caractères",
  invalid_code: "Code d'invitation invalide",
  used_code: "Ce code d'invitation a déjà été utilisé",
  expired_code: "Ce code d'invitation a expiré",
  email_taken: "Cet email est déjà utilisé",
  username_taken: "Ce pseudo est déjà pris",
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params.error ? errorMessages[params.error] : null

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-register">
      <div className="bg-black/35 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-2xl p-8 md:p-12 w-full max-w-3xl shadow-2xl shadow-black/40">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 md:items-stretch">

          {/* Partie gauche : logo + tagline */}
          <div className="flex flex-col items-center justify-center text-center md:flex-1 md:border-r md:border-white/10 md:pr-12">
            <img src="/logo.svg" alt="Panenka League" className="w-40 md:w-48 mb-4" />
            <p className="text-text-secondary text-sm">
              Crée ton compte pour rejoindre la ligue
            </p>
          </div>

          {/* Partie droite : formulaire */}
          <div className="md:flex-1">
            {errorMessage && (
              <div className="mb-6 px-4 py-3 bg-danger/10 border border-danger/30 text-danger rounded-lg text-sm">
                {errorMessage}
              </div>
            )}

            <form action={registerAction} className="space-y-5">
              <div>
                <label htmlFor="invitationCode" className="block text-sm font-medium text-text-secondary mb-2">
                  Code d&apos;invitation
                </label>
                <input
                  type="text"
                  id="invitationCode"
                  name="invitationCode"
                  required
                  placeholder="PANENKA-XXXX"
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                  Pseudo
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  minLength={3}
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
                <p className="text-xs text-text-muted mt-1">Au moins 8 caractères</p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-accent text-bg py-3 rounded-lg font-semibold hover:bg-accent-hover transition-colors"
              >
                Créer mon compte
              </button>

              <p className="text-center text-sm text-text-secondary pt-2">
                Déjà inscrit ?{" "}
                <Link href="/login" className="text-accent hover:underline">
                  Se connecter
                </Link>
              </p>
            </form>
          </div>

        </div>
      </div>
    </main>
  )
}