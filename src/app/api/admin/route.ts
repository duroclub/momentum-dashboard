// src/app/api/admin/route.ts
export const runtime = 'nodejs'


import { NextResponse } from 'next/server'
import {
  resetAll,
  seedUsers,
  simulateLogins,
  forceStalledUsers,
  sendIntervention,
  recordLogin,
  users,
} from '@/lib/data'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const action = body?.action as string | undefined

  try {
    switch (action) {
      case 'reset': {
        resetAll()
        return NextResponse.json({ ok: true })
      }

      case 'seed': {
        const count = Number(body?.count ?? 30)
        seedUsers(count)
        return NextResponse.json({ ok: true, users: users.length })
      }

      case 'simulateLogins': {
        const days = Number(body?.days ?? 7)
        simulateLogins(days)
        return NextResponse.json({ ok: true })
      }

      case 'forceStalled': {
        const count = Number(body?.count ?? 10)
        const ids = forceStalledUsers(count)
        return NextResponse.json({ ok: true, stalled: ids })
      }

      case 'sendInterventionsToStalled': {
        // Send an intervention to all currently stalled users
        // (Dashboard logic uses isStalled, but we can keep server-side simple by letting client call this per-user later)
        // For now: send to first N users as a demo, or use a client-driven action later.
        const count = Number(body?.count ?? 10)
        const targetIds = users.slice(0, count).map((u) => u.id)
        const results = targetIds.map((id) => sendIntervention(id))
        return NextResponse.json({ ok: true, interventions: results.length })
      }

      case 'simulateLogin': {
        const userId = String(body?.userId ?? '')
        if (!userId) return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 })
        recordLogin(userId)
        return NextResponse.json({ ok: true })
      }

      case 'sendIntervention': {
        const userId = String(body?.userId ?? '')
        const variant = body?.variant as 'A' | 'B' | undefined
        if (!userId) return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 })
        const iv = sendIntervention(userId, variant)
        return NextResponse.json({ ok: true, intervention: iv })
      }

      default:
        return NextResponse.json(
          { ok: false, error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Server error' },
      { status: 500 }
    )
  }
}
