// src/app/student/[id]/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { unstable_noStore as noStore } from 'next/cache'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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

// ----- derived logic (same as dashboard) -----
const STALL_HOURS = 72
const REENGAGE_HOURS = 48

function getLastLoginAt(store: Store, userId: string): number | null {
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

function isStalled(store: Store, userId: string) {
  const last = getLastLoginAt(store, userId)
  return hoursSince(last) >= STALL_HOURS
}

function getLatestIntervention(store: Store, userId: string): Intervention | null {
  for (let i = store.interventions.length - 1; i >= 0; i--) {
    const iv = store.interventions[i]
    if (iv.userId === userId) return iv
  }
  return null
}

function reengagedWithinWindow(store: Store, userId: string): boolean | null {
  const latest = getLatestIntervention(store, userId)
  if (!latest) return null

  const windowEnd = latest.sentAt + REENGAGE_HOURS * 60 * 60 * 1000

  for (let i = store.logins.length - 1; i >= 0; i--) {
    const e = store.logins[i]
    if (e.userId !== userId) continue
    if (e.timestamp < latest.sentAt) break
    if (e.timestamp <= windowEnd) return true
  }

  return false
}

// ----- admin actions -----
async function callAdmin(payload: Record<string, any>) {
  const res = await fetch(`${await baseUrl()}/api/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  return res.json()
}

export default async function StudentPage(props: { params: any }) {
  noStore()

  const p = await props.params
  const userId = String(p?.id ?? '')

  // 🔑 fetch shared state
  const res = await fetch(`${await baseUrl()}/api/state`, { cache: 'no-store' })
  const json = await res.json()
  const store: Store = json?.store ?? { users: [], logins: [], interventions: [] }

  const user = store.users.find((u) => u.id === userId)

  if (!user) {
    const sampleIds = store.users.slice(0, 10).map((u) => u.id)
  
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>User not found</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Requested ID: <b>{userId}</b>
        </p>
  
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd', borderRadius: 12 }}>
          <div><b>Store users count:</b> {store.users.length}</div>
          <div style={{ marginTop: 8 }}>
            <b>First 10 IDs:</b>
            <pre style={{ marginTop: 8, background: '#111', color: '#ddd', padding: 12, borderRadius: 8 }}>
              {JSON.stringify(sampleIds, null, 2)}
            </pre>
          </div>
        </div>
  
        <div style={{ marginTop: 16 }}>
          <Link href="/dashboard" style={{ fontWeight: 700 }}>
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    )
  }
  

  const last = getLastLoginAt(store, userId)
  const stalled = isStalled(store, userId)
  const hrs = hoursSince(last)
  const latestIv = getLatestIntervention(store, userId)
  const re = reengagedWithinWindow(store, userId)

  const userLogins = store.logins.filter((l) => l.userId === userId)
  const userInterventions = store.interventions.filter((iv) => iv.userId === userId)

  const btnStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    padding: '10px 12px',
    borderRadius: 10,
    background: 'white',
    cursor: 'pointer',
    fontWeight: 700,
  }

  const cardStyle: React.CSSProperties = {
    marginTop: 16,
    padding: 12,
    border: '1px solid #ddd',
    borderRadius: 12,
  }

  return (
    <main style={{ padding: 24, maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>
            {user.name ?? user.id}
          </h1>
          <p style={{ opacity: 0.8 }}>
            {user.id} · cohort <b>{user.cohort}</b>
          </p>
        </div>

        <Link href="/dashboard" style={{ fontWeight: 800 }}>
          ← Dashboard
        </Link>
      </div>

      <section style={cardStyle}>
        <div><b>Last login:</b> {formatTime(last)}</div>
        <div><b>Hours since:</b> {Number.isFinite(hrs) ? hrs.toFixed(1) : '∞'}</div>
        <div><b>Stalled:</b> {stalled ? 'Yes' : 'No'}</div>
        <div>
          <b>Latest intervention:</b>{' '}
          {latestIv ? `v${latestIv.variant}` : '—'}
        </div>
        <div>
          <b>Re-engaged (48h):</b>{' '}
          {re === null ? '—' : re ? 'Yes' : 'No'}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <form
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
          action={async (formData) => {
            'use server'
            const action = String(formData.get('action') ?? '')

            if (action === 'sendA')
              await callAdmin({ action: 'sendIntervention', userId, variant: 'A' })
            if (action === 'sendB')
              await callAdmin({ action: 'sendIntervention', userId, variant: 'B' })
            if (action === 'login')
              await callAdmin({ action: 'simulateLogin', userId })
            // 🔥 force re-render with fresh store
    redirect(`/student/${userId}`)
          }}
        >
          <button style={btnStyle} name="action" value="sendA">Send A</button>
          <button style={btnStyle} name="action" value="sendB">Send B</button>
          <button style={btnStyle} name="action" value="login">Simulate Login</button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontWeight: 900 }}>Timeline</h2>

        <div style={cardStyle}>
          <h3>Interventions</h3>
          {userInterventions.length === 0 ? 'None' : (
            <ul>
              {userInterventions.map((iv) => (
                <li key={iv.id}>
                  v{iv.variant} @ {new Date(iv.sentAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={cardStyle}>
          <h3>Logins</h3>
          {userLogins.length === 0 ? 'None' : (
            <ul>
              {userLogins.map((l, i) => (
                <li key={i}>{new Date(l.timestamp).toLocaleString()}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
