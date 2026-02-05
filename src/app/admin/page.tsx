'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

async function adminAction(payload: Record<string, any>) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [log, setLog] = useState<any>(null)

  async function run(label: string, payload: Record<string, any>) {
    setLoading(label)
    setLog(null)
    const out = await adminAction(payload)
    setLog(out)
    setLoading(null)
  }

  const busy = (label: string) => loading === label

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Admin</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Seed data and simulate behavior for the Momentum Dashboard prototype.
      </p>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => run('reset', { action: 'reset' })}
          disabled={!!loading}
        >
          {busy('reset') ? 'Resetting…' : 'Reset All'}
        </button>

        <button
          onClick={() => run('seed', { action: 'seed', count: 30 })}
          disabled={!!loading}
        >
          {busy('seed') ? 'Seeding…' : 'Seed 30 Users'}
        </button>

        <button
          onClick={() => run('simulate', { action: 'simulateLogins', days: 7 })}
          disabled={!!loading}
        >
          {busy('simulate') ? 'Simulating…' : 'Simulate 7 Days of Logins'}
        </button>

        <button
          onClick={() => run('force', { action: 'forceStalled', count: 10 })}
          disabled={!!loading}
        >
          {busy('force') ? 'Forcing…' : 'Force 10 Stalled Users'}
        </button>

        <button
          onClick={async () => {
            await run('bootstrap', { action: 'reset' })
            await run('bootstrap', { action: 'seed', count: 30 })
            await run('bootstrap', { action: 'simulateLogins', days: 7 })
            await run('bootstrap', { action: 'forceStalled', count: 10 })
            router.push('/dashboard')
          }}
          disabled={!!loading}
        >
          {busy('bootstrap') ? 'Bootstrapping…' : 'Bootstrap & Go to Dashboard'}
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={() => router.push('/dashboard')} disabled={!!loading}>
          Go to Dashboard →
        </button>
      </div>

      <pre style={{ marginTop: 24, padding: 12, background: '#111', color: '#ddd', borderRadius: 8, overflow: 'auto' }}>
        {log ? JSON.stringify(log, null, 2) : 'Run an action to see output…'}
      </pre>

      <style jsx>{`
        button {
          border: 1px solid #ccc;
          padding: 10px 12px;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          font-weight: 600;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  )
}
