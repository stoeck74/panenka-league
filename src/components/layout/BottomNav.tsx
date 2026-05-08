"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  House,
  SoccerBall,
  Trophy,
  UsersThree,
  UserCircle,
} from "@phosphor-icons/react"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>
}

const navItems: NavItem[] = [
  { label: "Accueil", href: "/dashboard", icon: House },
  { label: "Matchs", href: "/matchs", icon: SoccerBall },
  { label: "Classement", href: "/classement", icon: Trophy },
  { label: "Joueurs", href: "/joueurs", icon: UsersThree },
  { label: "Profil", href: "/settings", icon: UserCircle },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
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
      </div>
    </nav>
  )
}