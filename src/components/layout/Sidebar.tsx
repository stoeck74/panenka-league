"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  House,
  SoccerBall,
  Trophy,
  UsersThree,
  GearSix,
  ShieldCheck,
  SignOut,
} from "@phosphor-icons/react"
import { logoutAction } from "@/lib/actions/auth"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: "Accueil", href: "/dashboard", icon: House },
  { label: "Matchs", href: "/matchs", icon: SoccerBall },
  { label: "Classement", href: "/classement", icon: Trophy },
  { label: "Joueurs", href: "/joueurs", icon: UsersThree },
]

const bottomItems: NavItem[] = [
  { label: "Paramètres", href: "/settings", icon: GearSix },
  { label: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
]

type SidebarProps = {
  username: string
  role: string
}

export function Sidebar({ username, role }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const visibleBottomItems = bottomItems.filter(
    (item) => !item.adminOnly || role === "ADMIN"
  )

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`
        hidden md:flex flex-col
        sticky top-0 h-screen shrink-0
        bg-bg-elevated border-r border-border
        transition-all duration-300 ease-in-out
       ${expanded ? "w-[260px]" : "w-20"}
      `}
    >
{/* Header de la sidebar : logo + wordmark */}
<div className="flex items-center h-24 border-b border-border overflow-hidden">
  <Link href="/dashboard" className="flex items-center gap-3 px-3 w-full">
    <img
      src="/logo.svg"
      alt="Panenka League"
      className="h-14 w-14 object-contain shrink-0"
    />
    <div className={`flex flex-col leading-tight whitespace-nowrap transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
      <span className="text-2xl font-black tracking-wide text-text-primary">
        PANENKA
      </span>
      <span className="text-lg font-bold text-text-secondary">
        League
      </span>
    </div>
  </Link>
</div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-2.5 py-2.5 rounded-lg
                transition-colors
                ${active
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                }
              `}
            >
              <span className="shrink-0">
                  <Icon size={22} weight="thin" />
              </span>
              <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Section bottom : settings + admin */}
      <div className="px-3 py-4 border-t border-border space-y-1 overflow-hidden">
        {visibleBottomItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-2.5 py-2.5 rounded-lg
                transition-colors
                ${active
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                }
              `}
            >
              <span className="shrink-0">
              <Icon size={22} weight="thin" />
            </span>
                          <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Logout */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <SignOut size={22} weight="thin" className="shrink-0" />
            <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
              Déconnexion
            </span>
          </button>
        </form>
      </div>

      {/* Avatar utilisateur en bas */}
      <div className="px-3 py-4 border-t border-border overflow-hidden">
        <Link
          href={`/joueurs/${username}`}
          className="flex items-center gap-3 px-1 py-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
            <span className="text-accent text-xs font-bold uppercase">
              {username[0]}
            </span>
          </div>
          <div className={`flex-1 min-w-0 transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
            <p className="text-sm font-medium text-text-primary truncate">
              {username}
            </p>
            <p className="text-xs text-text-muted">Mon profil</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}