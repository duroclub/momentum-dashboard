// src/app/api/admin/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { readStore, writeStore, resetStore } from '@/lib/storeFile'
import type { Variant } from '@/lib/types'

function now() {
  return Date.now()
}
function hours(h: number) {
  return h * 60 * 60 * 1000
}
function id(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const action = body?.action as string | undefined

  try {
    if (action === 'reset') {
      await resetStore()
      return NextResponse.json({ ok: true })
    }

    const store = await readStore()

    switch (action) {
      case 'seed': {
        const count = Number(body?.count ?? 30)
        store.users = Array.from({ length: count }).map((_, i) => ({
          id: `user_${i + 1}`,
          name: `User ${i + 1}`,
          cohort: Math.random() < 0.5 ? 'control' : 'intervention',
        }))
        await writeStore(store)
        return NextResponse.json({ ok: true, users: store.users.length })
      }

      case 'simulateLogins': {
        const days = Number(body?.days ?? 7)
        store.logins = []
        const start = now() - days * 24 * 60 * 60 * 1000

        for (const u of store.users) {
          const loginCount = Math.floor(Math.random() * 13) // 0–12
          for (let i = 0; i < loginCount; i++) {
            const ts = start + Math.random() * (now() - start)
            store.logins.push({ userId: u.id, timestamp: Math.floor(ts) })
          }
        }

        store.logins.sort((a, b) => a.timestamp - b.timestamp)
        await writeStore(store)
        return NextResponse.json({ ok: true, logins: store.logins.length })
      }

      case 'forceStalled': {
        const count = Number(body?.count ?? 10)
        const chosen = store.users.slice(0, count)
        const cutoff = now() - hours(72)

        // Remove recent logins for chosen users
        store.logins = store.logins.filter(
          (l) => !(chosen.some((u) => u.id === l.userId) && l.timestamp >= cutoff)
        )

        // Add an old login (73–120h ago)
        for (const u of chosen) {
          const ts = now() - hours(73 + Math.random() * 47)
          store.logins.push({ userId: u.id, timestamp: Math.floor(ts) })
        }

        store.logins.sort((a, b) => a.timestamp - b.timestamp)
        await writeStore(store)
        return NextResponse.json({ ok: true, stalled: chosen.map((u) => u.id) })
      }

      case 'sendIntervention': {
        const userId = String(body?.userId ?? '')
        const variant = body?.variant as Variant | undefined
        if (!userId) return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 })

        const v: Variant = variant ?? pick<Variant>(['A', 'B'])
        const intervention = { id: id('iv'), userId, variant: v, sentAt: now() }

        store.interventions.push(intervention)
        await writeStore(store)
        return NextResponse.json({ ok: true, intervention })
      }

      case 'simulateLogin': {
        const userId = String(body?.userId ?? '')
        if (!userId) return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 })

        store.logins.push({ userId, timestamp: now() })
        store.logins.sort((a, b) => a.timestamp - b.timestamp)
        await writeStore(store)
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
