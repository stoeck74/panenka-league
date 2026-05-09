import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Pencil, Trophy, Lightning, Target } from "@phosphor-icons/react/dist/ssr"
import { EditableField } from "@/components/profile/EditableField"
import { updateFavoritePlayer } from "@/lib/actions/profile"
import { ProfileFavoritePlayer } from "@/components/profile/ProfileFavoritePlayer"
import { ProfileFavoriteTeam } from "@/components/profile/ProfileFavoriteTeam"
import { ProfileAvatar } from "@/components/profile/ProfileAvatar"

// ============================================
// TYPES
// ============================================

type ProfilePageProps = {
  params: Promise<{ username: string }>
}

// ============================================
// PAGE
// ============================================

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const session = await auth()

  if (!session) return null

  // Récupère le profil du user demandé (avec ses relations)
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    include: {
      favoriteTeam: true,
    },
  })

  if (!user) {
    notFound()
  }
  // Récupérer les 18 équipes pour le dropdown (uniquement si c'est ton profil)
const allTeams = await prisma.team.findMany({
  orderBy: { shortName: "asc" },
  select: {
    id: true,
    name: true,
    shortName: true,
    tla: true,
    crestUrl: true,
  },
})

  // Détecte si c'est ton propre profil
  const isOwnProfile = session.user.username.toLowerCase() === username.toLowerCase()

  // Classe CSS pour l'image de fond équipe
  const teamBgClass = user.favoriteTeam?.tla?.toLowerCase().trim() ?? ""

  
  // Date d'inscription formatée en FR
  const memberSince = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt))

  // ============================================
  // STATS — Placeholder pour V1
  // ============================================
  const stats = {
    position: "3e",
    totalPlayers: 8,
    bancosPlayed: 12,
    bestScore: 6,
    bestMatchday: 18,
  }

  return (
    
<div className={`relative bg-user ${teamBgClass} h-full p-6 md:p-10 lg:p-16 overflow-hidden`}>

      {/* ============================================
          HALOS DÉCORATIFS
          ============================================ */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[140px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[160px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* ============================================
          CONTENU — Card 50% gauche desktop, fullwidth mobile
          ============================================ */}
<div className="relative">
  <div className="w-full md:max-w-[50%]">

          {/* ============================================
              EN-TÊTE — Avatar + Pseudo + Membre depuis
              ============================================ */}
          <header className="mb-10 md:mb-12">
            <div className="flex items-center gap-6 mb-4">
              {/* Avatar */}
              <ProfileAvatar
                initialStyle={user.avatarStyle}
                initialSeed={user.avatarSeed}
                username={user.username}
                isOwnProfile={isOwnProfile}
              />

              {/* Pseudo + Membre depuis */}
              <div className="min-w-0">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-text-primary tracking-tight leading-none">
                  {user.username}
                </h1>
                <p className="text-xs md:text-sm uppercase tracking-widest text-text-muted mt-3">
                  Membre depuis {memberSince}
                </p>
              </div>
            </div>

            {/* Bouton Modifier — uniquement sur son propre profil */}
            {isOwnProfile && (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-text-secondary text-xs uppercase tracking-widest hover:bg-white/[0.06] hover:text-text-primary transition-all"
              >
                <Pencil size={14} weight="bold" />
                Modifier mon profil
              </button>
            )}
          </header>

          {/* ============================================
              SECTION IDENTITÉ — Équipe + Joueur favori
              ============================================ */}
          <section className="mb-10 md:mb-12 space-y-4">

          <ProfileFavoriteTeam
  teams={allTeams}
  currentTeamId={user.favoriteTeamId}
  isOwnProfile={isOwnProfile}
/>

{/* Joueur favori */}
<ProfileFavoritePlayer
  initialValue={user.favoritePlayer}
  isOwnProfile={isOwnProfile}
/>

          </section>

          {/* ============================================
              SECTION STATS — 3 chiffres identitaires
              ============================================ */}
          <section className="grid grid-cols-3 gap-3 md:gap-4">

            {/* Position */}
            <div className="rounded-2xl bg-black/35 backdrop-blur-xl backdrop-saturate-150 border border-white/10 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={14} weight="bold" className="text-accent" />
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-text-muted">
                  Position
                </p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-text-primary">
                {stats.position}
                <span className="text-text-muted text-sm font-normal ml-1">
                  / {stats.totalPlayers}
                </span>
              </p>
            </div>

            {/* Bancos joués */}
            <div className="rounded-2xl bg-black/35 backdrop-blur-xl backdrop-saturate-150 border border-white/10 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightning size={14} weight="bold" className="text-accent" />
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-text-muted">
                  Bancos
                </p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-text-primary">
                {stats.bancosPlayed}
              </p>
            </div>

            {/* Meilleur prono */}
            <div className="rounded-2xl bg-black/35 backdrop-blur-xl backdrop-saturate-150 border border-white/10 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} weight="bold" className="text-accent" />
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-text-muted">
                  Meilleur
                </p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-accent">
                +{stats.bestScore}
                <span className="text-text-muted text-sm font-normal ml-1">
                  J{stats.bestMatchday}
                </span>
              </p>
            </div>

          </section>

        </div>
      </div>

    </div>
  )
}