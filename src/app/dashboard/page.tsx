// src/app/dashboard/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { headers } from 'next/headers'
import Link from 'next/link'

type Cohort = 'control' | 'intervention'
type Variant = 'A' | 'B'

type User = { id: string; name?: string; cohort: Cohort }
type LoginEvent = { userId: string; timestamp: number }
type Intervention = { id: string; userId: string; variant: Variant; sentAt: number }

type Store = {
  users: User[]
  logins: LoginEvent[]
  interventions: Intervention[]
}

async function baseUrl() {
    const h = await headers()
    const host = h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'http'
    if (!host) throw new Error('Missing Host header')
    return `${proto}://${host}`
  }  

function formatTime(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

const STALL_HOURS = 72
const REENGAGE_HOURS = 48

function getLastLoginAt(store: Store, userId: string): number | null {
  // scan from end (latest) – store.logins should be sorted asc, but even if not, this still works-ish
  for (let i = store.logins.length - 1; i >= 0; i--) {
    const e = store.logins[i]
    if (e.userId === userId) return e.timestamp
  }
  return null
}

function hoursSince(ts: number | null, now = Date.now()) {
  if (!ts) return Infinity
  return (now - ts) / (1000 * 60 * 60)
}

function isStalled(store: Store, userId: string, now = Date.now()) {
  const last = getLastLoginAt(store, userId)
  return hoursSince(last, now) >= STALL_HOURS
}

function getLatestIntervention(store: Store, userId: string): Intervention | null {
  for (let i = store.interventions.length - 1; i >= 0; i--) {
    const iv = store.interventions[i]
    if (iv.userId === userId) return iv
  }
  return null
}

function reengagedWithinWindow(store: Store, userId: string, now = Date.now()): boolean | null {
  const latest = getLatestIntervention(store, userId)
  if (!latest) return null

  const windowEnd = latest.sentAt + REENGAGE_HOURS * 60 * 60 * 1000

  for (let i = store.logins.length - 1; i >= 0; i--) {
    const e = store.logins[i]
    if (e.userId !== userId) continue
    if (e.timestamp < latest.sentAt) break
    if (e.timestamp <= windowEnd) return true
  }

  // No login found inside the window (or not yet)
  return false
}

export default async function DashboardPage() {
    const res = await fetch(`${await baseUrl()}/api/state`, { cache: 'no-store' })
const json = await res.json()

const store: Store = json?.store ?? { users: [], logins: [], interventions: [] }
const users = store.users


  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ opacity: 0.8, marginTop: 6 }}>
            Stall detection (72h) and re-engagement within 48h after intervention.
          </p>
        </div>

        <Link href="/admin" style={{ fontWeight: 600 }}>
          ← Admin
        </Link>
      </div>

      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>User</th>
              <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Cohort</th>
              <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Last Login</th>
              <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Hours Since</th>
              <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Stalled?</th>
              <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Latest IV</th>
              <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Re-engaged (48h)</th>
              <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => {
              const last = getLastLoginAt(store, u.id)
              const stalled = isStalled(store, u.id)
              const hrs = hoursSince(last)
              const latestIv = getLatestIntervention(store, u.id)
              const re = reengagedWithinWindow(store, u.id)

              return (
                <tr key={u.id} style={{ background: stalled ? '#fff2f2' : 'transparent' }}>
                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontWeight: 700 }}>{u.name ?? u.id}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{u.id}</div>
                  </td>

                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>{u.cohort}</td>

                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>
                    {formatTime(last)}
                  </td>

                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>
                    {Number.isFinite(hrs) ? hrs.toFixed(1) : '∞'}
                  </td>

                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0', fontWeight: 700 }}>
                    {stalled ? 'Yes' : 'No'}
                  </td>

                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>
                    {latestIv
                      ? `v${latestIv.variant} @ ${new Date(latestIv.sentAt).toLocaleString()}`
                      : '—'}
                  </td>

                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0', fontWeight: 700 }}>
                    {re === null ? '—' : re ? 'Yes' : 'No'}
                  </td>

                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>
                    <Link href={`/student/${u.id}`} style={{ fontWeight: 600 }}>
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p style={{ marginTop: 16 }}>
          No users yet. Go to <Link href="/admin">/admin</Link> and click “Bootstrap”.
        </p>
      )}
    </main>
  )
}
