import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { runMatchesSync } from "@/lib/sync-matches-service"

// ============================================
// SYNC API → DB
// Endpoint appelé par un cron externe (cron-job.org)
// Sécurisé par un token en query param "?token=XXX" ou header Authorization.
//
// IMPORTANT : ce token (CRON_SECRET) ne doit JAMAIS être exposé côté client
// (pas de préfixe NEXT_PUBLIC_ dessus). Le bouton admin appelle
// /api/admin/sync-matches à la place, qui est protégé par la session admin.
//
// Modes :
//   - Normal (async) : réponse immédiate, sync en background
//   - ?wait=true     : attend la fin et retourne le log complet
//   - ?force=true    : recalcul forcé de tous les points
// ============================================

export async function GET(request: NextRequest) {
  const expectedToken = process.env.CRON_SECRET
  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 500 },
    )
  }

  const authHeader = request.headers.get("authorization")
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null
  const tokenFromQuery = request.nextUrl.searchParams.get("token")
  const providedToken = tokenFromHeader || tokenFromQuery

  if (providedToken !== expectedToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const forceRecalc = request.nextUrl.searchParams.get("force") === "true"
  const waitForCompletion =
    forceRecalc || request.nextUrl.searchParams.get("wait") === "true"

  if (waitForCompletion) {
    const result = await runMatchesSync(forceRecalc)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } else {
    after(async () => {
      await runMatchesSync(forceRecalc)
    })
    return NextResponse.json({
      ok: true,
      status: "Sync started in background. Check Vercel logs for completion.",
    })
  }
}
