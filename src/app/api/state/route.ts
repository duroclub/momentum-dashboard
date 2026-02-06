// src/app/api/state/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { readStore } from '@/lib/storeFile'

export async function GET() {
  const store = await readStore()
  return NextResponse.json({ ok: true, store })
}
