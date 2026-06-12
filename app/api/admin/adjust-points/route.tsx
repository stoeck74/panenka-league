import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { userId, bonusPoints } = await request.json() as {
      userId: string
      bonusPoints: number
    }

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId requis" }, { status: 400 })
    }
    if (!Number.isInteger(bonusPoints) || bonusPoints < -999 || bonusPoints > 999) {
      return NextResponse.json({ ok: false, error: "bonusPoints invalide (entier entre -999 et 999)" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { bonusPoints },
      select: { id: true, username: true, bonusPoints: true },
    })

    return NextResponse.json({ ok: true, user })
  } catch (error) {
    console.error("[adjust-points]", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}