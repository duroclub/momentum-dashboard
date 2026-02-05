// src/lib/data.ts
import type { User, LoginEvent, Intervention, Variant } from './types'
// ---- In-memory "database" (dev-only) ----
// NOTE: This resets whenever the server restarts (totally fine for a rapid proto).
type Store = {
    users: User[]
    logins: LoginEvent[]
    interventions: Intervention[]
  }
  
  const store: Store =
    (globalThis as any).__MOMENTUM_STORE__ ??
    ((globalThis as any).__MOMENTUM_STORE__ = {
      users: [],
      logins: [],
      interventions: [],
    })
  
  export const users = store.users
  export const logins = store.logins
  export const interventions = store.interventions


// ---- Helpers ----
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

// ---- Seeding ----
export function resetAll() {
  users.length = 0
  logins.length = 0
  interventions.length = 0
}

export function seedUsers(count = 30) {
  users.length = 0

  for (let i = 0; i < count; i++) {
    users.push({
      id: `user_${i + 1}`,
      name: `User ${i + 1}`,
      cohort: Math.random() < 0.5 ? 'control' : 'intervention',
    })
  }

  return users
}

/**
 * Simulates login history over N days.
 * Produces realistic-ish last-login distributions:
 * - some users log in recently
 * - some users go quiet (stalled candidates)
 */
export function simulateLogins(days = 7) {
  logins.length = 0

  const start = now() - days * 24 * 60 * 60 * 1000

  for (const u of users) {
    // Each user gets 0–12 logins across the period
    const loginCount = Math.floor(Math.random() * 13)

    for (let i = 0; i < loginCount; i++) {
      const ts = start + Math.random() * (now() - start)
      logins.push({ userId: u.id, timestamp: Math.floor(ts) })
    }
  }

  // Sort asc (useful for timelines)
  logins.sort((a, b) => a.timestamp - b.timestamp)

  return logins
}

/**
 * Forces N users to become "stalled" by ensuring their last login is > 72h ago.
 * (We do this by removing recent logins and adding one old login.)
 */
export function forceStalledUsers(count = 10) {
  const chosen = users.slice(0, count)

  for (const u of chosen) {
    // Remove logins in last 72h
    const cutoff = now() - hours(72)
    for (let i = logins.length - 1; i >= 0; i--) {
      if (logins[i].userId === u.id && logins[i].timestamp >= cutoff) {
        logins.splice(i, 1)
      }
    }

    // Add a login between 73h and 120h ago (3–5 days)
    const ts = now() - hours(73 + Math.random() * 47)
    logins.push({ userId: u.id, timestamp: Math.floor(ts) })
  }

  logins.sort((a, b) => a.timestamp - b.timestamp)
  return chosen.map((u) => u.id)
}

// ---- Queries ----
export function getLastLoginAt(userId: string): number | null {
  // Scan from the end for speed (latest logins are at the end after sorting)
  for (let i = logins.length - 1; i >= 0; i--) {
    if (logins[i].userId === userId) return logins[i].timestamp
  }
  return null
}

export function getUserTimeline(userId: string) {
  const userLogins = logins.filter((l) => l.userId === userId)
  const userInterventions = interventions.filter((iv) => iv.userId === userId)
  return { userLogins, userInterventions }
}

// ---- Actions ----
export function recordLogin(userId: string, timestamp = now()) {
  logins.push({ userId, timestamp })
  logins.sort((a, b) => a.timestamp - b.timestamp)
}

export function sendIntervention(userId: string, variant?: Variant) {
  const v: Variant = variant ?? pick<Variant>(['A', 'B'])

  const intervention: Intervention = {
    id: id('iv'),
    userId,
    variant: v,
    sentAt: now(),
  }

  interventions.push(intervention)
  return intervention
}

export function getLatestIntervention(userId: string): Intervention | null {
    for (let i = interventions.length - 1; i >= 0; i--) {
      if (interventions[i].userId === userId) return interventions[i]
    }
    return null
  }
  