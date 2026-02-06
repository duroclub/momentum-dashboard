// src/lib/storeFile.ts
import fs from 'node:fs/promises'
import path from 'node:path'
import type { User, LoginEvent, Intervention } from './types'

export type Store = {
  users: User[]
  logins: LoginEvent[]
  interventions: Intervention[]
}

const STORE_PATH = path.join(process.cwd(), '.momentum-store.json')

const EMPTY: Store = { users: [], logins: [], interventions: [] }

export async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    return JSON.parse(raw) as Store
  } catch {
    return EMPTY
  }
}

export async function writeStore(store: Store): Promise<void> {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

export async function resetStore(): Promise<void> {
  await writeStore(EMPTY)
}
