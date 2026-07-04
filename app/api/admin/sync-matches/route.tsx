import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import { runMatchesSync } from "@/lib/sync-matches-service"

// ============================================
// SYNC MATCHES — déclenchée depuis le bouton admin
// ============================================
// Protégée par la session (role ADMIN), comme les autres routes
// app/api/admin/*. Remplace l'ancien appel direct à /api/sync-matches
// depuis le client, qui nécessitait d'exposer CRON_SECRET dans le bundle
// JS via NEXT_PUBLIC_CRON_SECRET — une faille de sécurité (n'importe quel
// visiteur pouvait extraire le token et déclencher la sync lui-même).
// ============================================

export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const result = await runMatchesSync(true)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
