export type User = {
    id: string
    lastLoginAt: number | null
    cohort: 'control' | 'intervention'
  }
  
  export type Intervention = {
    userId: string
    variant: 'A' | 'B'
    sentAt: number
  }
  
  export type LoginEvent = {
    userId: string
    timestamp: number
  }
  