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

  const btnStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    padding: '10px 12px',
    borderRadius: 10,
    background: 'white',
    cursor: 'pointer',
    fontWeight: 700,
  }

  const btnDisabled: React.CSSProperties = {
    ...btnStyle,
    opacity: 0.6,
    cursor: 'not-allowed',
  }

  const busy = (label: string) => loading === label
  const disabled = (label: string) => !!loading && !busy(label)

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Admin</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Seed data and simulate behavior for the Momentum Dashboard prototype.
      </p>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          style={disabled('reset') ? btnDisabled : btnStyle}
          onClick={() => run('reset', { action: 'reset' })}
          disabled={!!loading}
        >
          {busy('reset') ? 'Resetting…' : 'Reset All'}
        </button>

        <button
          style={disabled('seed') ? btnDisabled : btnStyle}
          onClick={() => run('seed', { action: 'seed', count: 30 })}
          disabled={!!loading}
        >
          {busy('seed') ? 'Seeding…' : 'Seed 30 Users'}
        </button>

        <button
          style={disabled('simulate') ? btnDisabled : btnStyle}
          onClick={() => run('simulate', { action: 'simulateLogins', days: 7 })}
          disabled={!!loading}
        >
          {busy('simulate') ? 'Simulating…' : 'Simulate 7 Days of Logins'}
        </button>

        <button
          style={disabled('force') ? btnDisabled : btnStyle}
          onClick={() => run('force', { action: 'forceStalled', count: 10 })}
          disabled={!!loading}
        >
          {busy('force') ? 'Forcing…' : 'Force 10 Stalled Users'}
        </button>

        <button
          style={disabled('bootstrap') ? btnDisabled : btnStyle}
          onClick={async () => {
            setLoading('bootstrap')
            setLog(null)
            await adminAction({ action: 'reset' })
            await adminAction({ action: 'seed', count: 30 })
            await adminAction({ action: 'simulateLogins', days: 7 })
            await adminAction({ action: 'forceStalled', count: 10 })
            setLoading(null)
            router.push('/dashboard')
          }}
          disabled={!!loading}
        >
          {busy('bootstrap') ? 'Bootstrapping…' : 'Bootstrap & Go to Dashboard'}
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button style={btnStyle} onClick={() => router.push('/dashboard')} disabled={!!loading}>
          Go to Dashboard →
        </button>
      </div>

      <pre
        style={{
          marginTop: 24,
          padding: 12,
          background: '#111',
          color: '#ddd',
          borderRadius: 8,
          overflow: 'auto',
        }}
      >
        {log ? JSON.stringify(log, null, 2) : 'Run an action to see output…'}
      </pre>
    </main>
  )
}
