import { auth } from "@/../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Charge l'avatar config (pas dans la session NextAuth)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarStyle: true, avatarSeed: true },
  })

  return (
    <div className="min-h-screen flex">
      {/* Sidebar : visible uniquement sur desktop (md+) */}
      <Sidebar
        username={session.user.username}
        role={session.user.role}
        avatarStyle={user?.avatarStyle ?? null}
        avatarSeed={user?.avatarSeed ?? null}
      />

      {/* Zone de contenu principale */}
      <main className="min-h-screen pb-20 md:pb-0 w-full md:w-[calc(100vw-80px)] shrink-0 transition-transform duration-300">
        {children}
      </main>

      {/* Bottom nav : visible uniquement sur mobile (< md) */}
      <BottomNav username={session.user.username} role={session.user.role} />
    </div>
  )
}