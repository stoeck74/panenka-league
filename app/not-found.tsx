import Link from "next/link"
import { ArrowRight, SoccerBall } from "@phosphor-icons/react/dist/ssr"

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg p-6">
      {/* Halos décoratifs cohérents avec le dashboard */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[200px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[180px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

      <div className="relative max-w-2xl w-full text-center">
        {/* Eyebrow */}
        <p className="text-xs uppercase tracking-widest text-text-muted mb-4">
          Erreur 404
        </p>

        {/* Gros chiffre 404 en gradient lime */}
        <h1
          className="text-[20vw] md:text-[12rem] font-black leading-none mb-2 select-none"
          style={{
            background: "linear-gradient(135deg, #A8FF00, #65a30d)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          aria-label="404"
        >
          404
        </h1>

        {/* Phrase d'accroche thématique */}
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
          La page est partie en{" "}
          <span className="italic text-accent">cuillère</span>
        </h2>

        <p className="text-text-secondary mb-10 max-w-md mx-auto">
          Ce lien n&apos;existe pas (ou plus). Mais puisque tu es là...
        </p>

        {/* Encadré pédago : l'histoire de la Panenka */}
        <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6 md:p-8 mb-10 text-left">
          <div className="flex items-center gap-2 mb-3">
            <SoccerBall size={20} weight="duotone" className="text-accent" />
            <p className="text-xs uppercase tracking-widest text-accent">
              Le saviez-vous&nbsp;?
            </p>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-3">
            Belgrade, 20 juin 1976
          </h3>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Finale de l&apos;Euro, Tchécoslovaquie contre Allemagne de l&apos;Ouest. Tirs au but. C&apos;est au tour
            d&apos;<span className="text-text-primary font-medium">Antonín Panenka</span> de tirer, le dernier.
            S&apos;il marque, son pays gagne son premier (et seul) titre européen.
          </p>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed mt-3">
            Course d&apos;élan classique, et puis — <span className="text-accent font-medium">une cuillère</span>. Une feinte de
            tir qui propulse le ballon en cloche, doucement, au milieu d&apos;un but vide. Le gardien Sepp Maier vient
            de plonger sur le côté. Sidération.
          </p>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed mt-3">
            Ce geste audacieux a depuis pris son nom. Tirer une <span className="italic text-text-primary">panenka</span>,
            c&apos;est risquer beaucoup pour gagner gros — exactement l&apos;esprit du jeu auquel tu joues ici.
          </p>
        </div>

        {/* Bouton retour */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-accent text-bg px-6 py-3 rounded-lg font-semibold hover:bg-accent-hover transition-colors group"
        >
          Retour au dashboard
          <ArrowRight
            size={18}
            weight="bold"
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
    </div>
  )
}