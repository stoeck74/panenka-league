import { LoginForm } from "@/components/login/LoginForm"


const errorMessages: Record<string, string> = {
  missing: "Email et mot de passe requis",
  invalid: "Email ou mot de passe incorrect",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params.error ? errorMessages[params.error] : null

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-login">
<div className="bg-black/35 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-2xl p-8 md:p-12 w-full max-w-3xl shadow-2xl shadow-black/40">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 md:items-stretch">

          {/* Partie gauche : logo + tagline */}
          <div className="flex flex-col items-center justify-center text-center md:flex-1 md:border-r md:border-white/10 md:pr-12">
            <img src="/logo.svg" alt="World Cup League" className="w-40 md:w-48 mb-4" />
          </div>

 {/* Partie droite : formulaire */}
          <div className="md:flex-1">
            <LoginForm errorMessage={errorMessage} />
          </div> 

        </div>
      </div>
    </main>
  )
}