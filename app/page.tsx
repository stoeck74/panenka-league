import Link from "next/link"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { SlotMachine } from "@/components/landing/SlotMachine"

export default function Home() {
  return (
<main className="relative min-h-screen bg-home overflow-hidden">

  {/* ============================================
      HALOS DÉCORATIFS — Ambiance chartreuse
      ============================================ */}
  <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />
  <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-accent/8 rounded-full blur-[160px] pointer-events-none translate-x-1/3 translate-y-1/3" />
      {/* ============================================
          NAV TOP
          ============================================ */}
<nav className="absolute top-0 left-0 right-0 z-30 px-6 md:px-10 lg:px-16 py-6 flex items-center justify-between">
  
  {/* Logo + Wordmark — Caché sur mobile */}
<div className="flex items-center gap-3">

    <img src="/logo.svg" alt="" className="h-36 w-36" />
    <div className="flex flex-col leading-tight">
      <span className="text-3xl font-extrabold tracking-wider text-text-primary">
        PANENKA
      </span>
      <span className="text-xl font-medium text-text-secondary -mt-0.5">
        League
      </span>
    </div>
  </div>

  {/* Liens — Cachés sur mobile, visibles desktop */}
  <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest">
    <Link
      href="/login"
      className="text-text-secondary hover:text-text-primary transition-colors"
    >
      Connexion
    </Link>
    <Link
      href="/register"
      className="bg-accent text-bg px-4 py-2 rounded-md font-semibold hover:bg-accent-hover transition-colors"
    >
      S'inscrire
    </Link>
  </div>

</nav>



{/* ============================================
    HERO — S25/26 + SlotMachine sur la même ligne
    ============================================ */}
<div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 px-6 md:px-10 lg:px-16 z-20">
<p className="hidden md:block text-xs uppercase tracking-[0.3em] text-text-muted mb-6 text-center">
  Saison en cours
</p>

<div className="flex flex-col md:flex-row items-center md:justify-center gap-6 lg:gap-10">
  
  {/* S25/26 — Caché sur mobile, visible desktop */}
  <div className="hidden md:flex flex-1 justify-end pr-18">
    <h1 className="text-[8vw] font-black leading-none tracking-tight text-text-primary">
      <span className="text-accent font-black tracking-tight font-serif">saison <br /></span>25<span className="text-accent font-serif">/</span>26
    </h1>
  </div>

  {/* SlotMachine — Centré sur mobile, aligné à gauche desktop */}
  <div className="w-full md:flex-1 flex justify-center md:justify-start">
    <div className="text-[20vw] md:text-[8vw] font-black leading-none tracking-tighter text-accent w-full font-sans italic font-bold text-center md:text-left">
      <SlotMachine />
    </div>
  </div>

  {/* Liens Connexion + S'inscrire — Visibles uniquement sur mobile, sous le slot */}
  <div className="flex md:hidden items-center justify-center gap-6 text-xs uppercase tracking-widest mt-6">
    <Link
      href="/login"
      className="text-text-secondary hover:text-text-primary transition-colors"
    >
      Connexion
    </Link>
    <Link
      href="/register"
      className="bg-accent text-bg px-4 py-2 rounded-md font-semibold hover:bg-accent-hover transition-colors"
    >
      S'inscrire
    </Link>
  </div>
</div>
</div>
        {/* ============================================
            BAS DE PAGE — EDITION + TAGLINE + CTA
            ============================================ */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 lg:px-16 pb-10 z-20">
          <div className="flex items-end justify-between gap-8">

            {/* Edition à gauche */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted mb-2">
                Edition
              </p>
              <p className="text-3xl md:text-4xl font-black text-text-primary">
                2026
              </p>
            </div>

            {/* Tagline + CTA à droite */}
            <div className="flex flex-col items-end max-w-md text-right">
              <p className="text-sm md:text-base text-text-secondary mb-4 leading-relaxed">
                Le jeu de pronostics Ligue 1<br />
                entre potes.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-3 text-text-primary hover:text-accent transition-colors group"
              >
                <span className="text-sm uppercase tracking-widest font-medium">
                  Rejoindre la ligue
                </span>
                <span className="w-12 h-12 rounded-full border border-text-primary group-hover:border-accent flex items-center justify-center transition-colors">
                  <ArrowRight size={18} weight="thin" className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>

          </div>
        </div>



    </main>
  )
}