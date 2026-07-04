"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  House,
  SoccerBall,
  Trophy,
  UsersThree,
  UserCircle,
  DotsThreeCircle,
  Ranking,
  Crosshair,
  Question,
  ShieldCheck,
  SignOut,
  X,
} from "@phosphor-icons/react"
import { logoutAction } from "@/lib/actions/auth"

// ============================================
// BARRE DU BAS — 4 destinations fréquentes + "Plus"
// ============================================
// Une barre du bas ne peut raisonnablement afficher que ~5 icônes.
// On y met donc les 4 pages consultées le plus souvent (semaine après
// semaine), et tout le reste (Participants, Ligue 1, aide, admin,
// déconnexion) va dans le tiroir "Plus" — sinon ces pages/actions sont
// tout simplement injoignables sur mobile (la Sidebar desktop qui les
// contient est cachée en `hidden md:flex`).

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>
}

function getPrimaryItems(username: string): NavItem[] {
  return [
    { label: "Accueil", href: "/dashboard", icon: House },
    { label: "Pronostics", href: "/matchs", icon: SoccerBall },
    { label: "Classement", href: "/classement", icon: Trophy },
    // Avant : "/settings", une route qui n'existe pas — lien mort sur mobile
    { label: "Profil", href: `/joueurs/${username}`, icon: UserCircle },
  ]
}

type MoreGroup = {
  title: string | null
  items: NavItem[]
}

function getMoreGroups(role: string): MoreGroup[] {
  const panenkaItems: NavItem[] = [
    { label: "Participants", href: "/joueurs", icon: UsersThree },
  ]
  if (role === "ADMIN") {
    panenkaItems.push({ label: "Admin", href: "/admin", icon: ShieldCheck })
  }

  return [
    { title: "Panenka", items: panenkaItems },
    {
      title: "Ligue 1",
      items: [
        { label: "Classement", href: "/resultats", icon: Ranking },
        { label: "Buteurs", href: "/buteurs", icon: Crosshair },
      ],
    },
    { title: null, items: [{ label: "Comment ça marche", href: "/aide", icon: Question }] },
  ]
}

type BottomNavProps = {
  username: string
  role: string
}

export function BottomNav({ username, role }: BottomNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const primaryItems = getPrimaryItems(username)
  const moreGroups = getMoreGroups(role)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  // "Plus" est actif si on est sur une des pages qu'il contient, pour ne
  // pas laisser la barre du bas sans aucun onglet allumé.
  const moreIsActive = moreGroups
    .flatMap((g) => g.items)
    .some((item) => isActive(item.href))

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1
                  flex-1 h-full
                  transition-colors
                  ${active ? "text-accent" : "text-text-secondary hover:text-text-primary"}
                `}
              >
                <Icon size={24} weight={active ? "regular" : "thin"} />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* Bouton "Plus" — ouvre le tiroir avec le reste de la nav */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`
              flex flex-col items-center justify-center gap-1
              flex-1 h-full
              transition-colors
              ${moreIsActive ? "text-accent" : "text-text-secondary hover:text-text-primary"}
            `}
          >
            <DotsThreeCircle size={24} weight={moreIsActive ? "regular" : "thin"} />
            <span className="text-[10px] font-medium leading-none">Plus</span>
          </button>
        </div>
      </nav>

      {/* ============================================
          TIROIR "PLUS" — bottom sheet
          ============================================ */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/70"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-bg-elevated border-t border-border pb-8 pt-4 px-4 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest text-text-muted">Menu</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {moreGroups.map((group, i) => (
              <div key={group.title ?? `group-${i}`} className={i > 0 ? "mt-3 pt-3 border-t border-white/10" : ""}>
                {group.title && (
                  <p className="px-1 mb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted/70">
                    {group.title}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                          ${active
                            ? "bg-accent/10 text-accent"
                            : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                          }
                        `}
                      >
                        <Icon size={20} weight="regular" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Déconnexion */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
                >
                  <SignOut size={20} weight="regular" />
                  <span className="text-sm font-medium">Déconnexion</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}