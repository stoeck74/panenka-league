import Link from "next/link"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { SlotMachine } from "@/components/landing/SlotMachine"
import { HomeAnimations } from "@/components/landing/HomeAnimations"


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
      <nav data-anim="nav" className="absolute top-0 left-0 right-0 z-30 px-6 md:px-10 lg:px-16 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-16 w-16 md:h-24 md:w-24" />
          <div className="flex flex-col leading-tight">
            <span className="text-xl md:text-3xl font-extrabold tracking-wider text-text-primary">
              PANENKA
            </span>
            <span className="text-base md:text-xl font-medium text-text-secondary -mt-0.5">
              League
            </span>
          </div>
        </div>

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
            S&apos;inscrire
          </Link>
        </div>
      </nav>

      {/* ============================================
          HERO CENTRAL — Slot machine massive + CTA
          ============================================ */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-10 lg:px-16 z-20">

        {/* Petit label éditorial au-dessus */}
        <p data-anim="label" className="text-xs uppercase tracking-[0.4em] text-text-muted mb-8 md:mb-12">
          Saison en cours
        </p>

        {/* SLOT MACHINE en énorme, centrée */}
        <div data-anim="slot" className="w-full text-center mb-10 md:mb-12">
          <div className="text-[20vw] md:text-[16vw] lg:text-[14vw] font-black leading-none tracking-tighter text-accent italic">
            <SlotMachine />
          </div>
        </div>

        {/* Trait décoratif */}
        <div data-anim="divider" className="w-24 h-px bg-text-muted mb-6" />

    
<Link
  href="/login"
  data-anim="cta"
  className="group relative inline-flex items-center gap-4 bg-accent text-bg px-10 md:px-12 py-5 md:py-6 rounded-full text-base md:text-lg font-bold uppercase tracking-widest transition-all duration-300 hover:shadow-2xl hover:shadow-accent/40"
>
  <span className="relative z-10">Rejoindre la ligue</span>
  <ArrowRight
    size={20}
    weight="bold"
    className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
  />
</Link>

        {/* Liens secondaires sur mobile */}
        <div className="flex md:hidden items-center justify-center gap-6 text-xs uppercase tracking-widest mt-8">
          <Link
            href="/login"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Déjà inscrit ? <span className="text-accent">Connexion</span>
          </Link>
        </div>

      </div>

      {/* ============================================
          FOOTER ÉDITORIAL — En bas
          ============================================ */}
      <div data-anim="footer" className="absolute bottom-0 left-0 right-0 px-6 md:px-10 lg:px-16 pb-8 z-20 hidden md:block">
        <div className="flex items-end justify-between gap-8">

          {/* Saison + Edition à gauche */}
          <div className="flex items-end gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted mb-1">
                Saison
              </p>
              <p className="text-2xl font-black text-text-primary">
                S25/26
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted mb-1">
                Edition
              </p>
              <p className="text-2xl font-black text-text-primary">
                2026
              </p>
            </div>
          </div>

          {/* Crédit à droite (optionnel mais classe) */}
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
              Pronostics ·
              <span className="text-accent"> Ligue 1</span>
            </p>
          </div>

        </div>
      </div>
<HomeAnimations />
    </main>
  )
}