import { NextResponse } from 'next/server'
import { dbConfigured, isDbConnected, connectDb } from '@/lib/db'

export async function GET() {
  let connected = isDbConnected()
  if (dbConfigured && !connected) {
    connected = Boolean(await connectDb())
  }
  return NextResponse.json({ db: dbConfigured && connected })
}