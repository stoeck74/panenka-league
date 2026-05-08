import { auth } from "@/../auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  console.log("[AppLayout] session:", session)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar : visible uniquement sur desktop (md+) */}
      <Sidebar
        username={session.user.username}
        role={session.user.role}
      />

      {/* Zone de contenu principale */}
      <main className="flex-1 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav : visible uniquement sur mobile (< md) */}
      <BottomNav />
    </div>
  )
}