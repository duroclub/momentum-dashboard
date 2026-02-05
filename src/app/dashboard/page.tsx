// src/app/dashboard/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { users, getLastLoginAt } from '@/lib/data'
import { isStalled, hoursSinceLastLogin, getLatestIntervention, reengagedWithinWindow } from '@/lib/logic'



function formatTime(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export default function DashboardPage() {
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
              const last = getLastLoginAt(u.id)
              const stalled = isStalled(u.id)
              const hrs = hoursSinceLastLogin(u.id)
              const latestIv = getLatestIntervention(u.id)
              const re = reengagedWithinWindow(u.id)

              return (
                <tr key={u.id} style={{ background: stalled ? '#fff2f2' : 'transparent' }}>
                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontWeight: 700 }}>{u.name ?? u.id}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{u.id}</div>
                  </td>

                  <td style={{ padding: 10, borderBottom: '1px solid #f0f0f0' }}>
                    {u.cohort}
                  </td>

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
                    {latestIv ? `v${latestIv.variant} @ ${new Date(latestIv.sentAt).toLocaleString()}` : '—'}
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
