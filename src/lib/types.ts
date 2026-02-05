// src/lib/types.ts

export type Cohort = 'control' | 'intervention'
export type Variant = 'A' | 'B'

export type User = {
  id: string
  name?: string
  cohort: Cohort
}

export type LoginEvent = {
  userId: string
  timestamp: number // Date.now()
}

export type Intervention = {
  id: string
  userId: string
  variant: Variant
  sentAt: number
}
