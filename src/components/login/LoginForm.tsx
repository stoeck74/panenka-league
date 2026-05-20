"use client"

import { useFormStatus } from "react-dom"
import { loginAction } from "@/lib/actions/auth"
import Link from "next/link"

type LoginFormProps = {
  errorMessage: string | null
}

export function LoginForm({ errorMessage }: LoginFormProps) {
  return (
    <>
      {errorMessage && (
        <div className="mb-6 px-4 py-3 bg-danger/10 border border-danger/30 text-danger rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <form action={loginAction} className="space-y-5">
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
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <SubmitButton />

        <p className="text-center text-sm text-text-secondary pt-2">
          Pas encore inscrit ?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Créer un compte
          </Link>
        </p>
      </form>
    </>
  )
}

// ============================================
// Bouton submit avec état de chargement
// ============================================
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        w-full mt-2 py-3 rounded-lg font-semibold transition-all
        ${pending
          ? "bg-accent/60 text-bg cursor-wait"
          : "bg-accent text-bg hover:bg-accent-hover cursor-pointer"
        }
      `}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
          Connexion en cours...
        </span>
      ) : (
        "Se connecter"
      )}
    </button>
  )
}