// src/lib/logic.ts
import { getLastLoginAt, interventions, logins } from './data'
import type { Intervention } from './types'

export const STALL_THRESHOLD_HOURS = 72
export const REENGAGE_WINDOW_HOURS = 48

function hoursToMs(h: number) {
  return h * 60 * 60 * 1000
}

export function hoursSinceLastLogin(userId: string, now = Date.now()): number {
  const last = getLastLoginAt(userId)
  if (!last) return Infinity
  return (now - last) / (1000 * 60 * 60)
}

export function isStalled(userId: string, now = Date.now()): boolean {
  return hoursSinceLastLogin(userId, now) >= STALL_THRESHOLD_HOURS
}

export function getLatestIntervention(userId: string): Intervention | null {
  for (let i = interventions.length - 1; i >= 0; i--) {
    if (interventions[i].userId === userId) return interventions[i]
  }
  return null
}

export function reengagedWithinWindow(
  userId: string,
  now = Date.now()
): boolean | null {
  const latest = getLatestIntervention(userId)
  if (!latest) return null

  const windowEnd = latest.sentAt + hoursToMs(REENGAGE_WINDOW_HOURS)

  for (let i = logins.length - 1; i >= 0; i--) {
    const e = logins[i]
    if (e.userId !== userId) continue
    if (e.timestamp < latest.sentAt) break
    if (e.timestamp <= windowEnd) return true
  }

  // If window not over yet and no login found, it's just "not yet"
  if (now <= windowEnd) return false

  return false
}
