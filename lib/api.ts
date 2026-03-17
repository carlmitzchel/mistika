/**
 * Shared API utilities: auth guard, response helpers, ID generation.
 */
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { auth } from '@clerk/nextjs/server'

export function id(): string {
  return uuidv4()
}

export function slug(): string {
  return uuidv4()
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Returns the Clerk userId or throws a 401 response.
 * Usage: const userId = await requireAuth()
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return userId
}
