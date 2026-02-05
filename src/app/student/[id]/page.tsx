export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { users, getUserTimeline, getLastLoginAt } from '@/lib/data'
import { isStalled, hoursSinceLastLogin, getLatestIntervention, reengagedWithinWindow } from '@/lib/logic'

async function postAdmin(payload: Record<string, any>) {
  const res = await fetch('http://localhost:3000/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  return res.json()
}

export default async function StudentPage({ params }: { params: { id: string } }) {
  const userId = params.id
  const user = users.find((u) => u.id === userId)

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>User not found</h1>
        <Link href="/dashboard">← Back</Link>
      </main>
    )
  }

  const last = getLastLoginAt(userId)
  const stalled = isStalled(userId)
  const hrs = hoursSinceLastLogin(userId)
  const latestIv = getLatestIntervention(userId)
  const re = reengagedWithinWindow(userId)

  const { userLogins, userInterventions } = getUserTimeline(userId)

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>{user.name ?? user.id}</h1>
          <p style={{ opacity: 0.8 }}>
            {user.id} · cohort: <b>{user.cohort}</b>
          </p>
        </div>

        <Link href="/dashboard" style={{ fontWeight: 600 }}>
          ← Dashboard
        </Link>
      </div>

      <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd', borderRadius: 12 }}>
        <div><b>Last login:</b> {last ? new Date(last).toLocaleString() : '—'}</div>
        <div><b>Hours since login:</b> {Number.isFinite(hrs) ? hrs.toFixed(1) : '∞'}</div>
        <div><b>Stalled (72h):</b> {stalled ? 'Yes' : 'No'}</div>
        <div><b>Latest intervention:</b> {latestIv ? `v${latestIv.variant} @ ${new Date(latestIv.sentAt).toLocaleString()}` : '—'}</div>
        <div><b>Re-engaged within 48h:</b> {re === null ? '—' : re ? 'Yes' : 'No'}</div>
      </div>

      {/* Actions */}
      <form
        style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}
        action={async (formData) => {
          'use server'
          const action = String(formData.get('action') ?? '')
          const variant = String(formData.get('variant') ?? '') as 'A' | 'B' | ''

          if (action === 'sendA') await postAdmin({ action: 'sendIntervention', userId, variant: 'A' })
          if (action === 'sendB') await postAdmin({ action: 'sendIntervention', userId, variant: 'B' })
          if (action === 'login') await postAdmin({ action: 'simulateLogin', userId })
        }}
      >
        <button name="action" value="sendA">Send Intervention A</button>
        <button name="action" value="sendB">Send Intervention B</button>
        <button name="action" value="login">Simulate Login</button>
      </form>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Timeline</h2>

        <div style={{ marginTop: 12 }}>
          <h3 style={{ fontWeight: 700 }}>Interventions</h3>
          <ul>
            {userInterventions.length === 0 ? (
              <li style={{ opacity: 0.7 }}>None</li>
            ) : (
              userInterventions
                .slice()
                .sort((a, b) => b.sentAt - a.sentAt)
                .map((iv) => (
                  <li key={iv.id}>
                    v{iv.variant} — {new Date(iv.sentAt).toLocaleString()}
                  </li>
                ))
            )}
          </ul>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3 style={{ fontWeight: 700 }}>Logins</h3>
          <ul>
            {userLogins.length === 0 ? (
              <li style={{ opacity: 0.7 }}>None</li>
            ) : (
              userLogins
                .slice()
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 20)
                .map((l, idx) => (
                  <li key={`${l.userId}_${l.timestamp}_${idx}`}>
                    {new Date(l.timestamp).toLocaleString()}
                  </li>
                ))
            )}
          </ul>
        </div>
      </div>

      <style jsx>{`
        button {
          border: 1px solid #ccc;
          padding: 10px 12px;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          font-weight: 700;
        }
      `}</style>
    </main>
  )
}
