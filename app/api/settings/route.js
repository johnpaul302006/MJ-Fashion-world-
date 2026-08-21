import { NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/data'
import { dbConfigured } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { availableGateways } from '@/lib/payments'

export async function GET() {
  const settings = await getSettings()
  return NextResponse.json({ settings, paymentGateways: availableGateways() })
}

export async function PUT(request) {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
  if (!dbConfigured) {
    return NextResponse.json(
      { error: 'database_not_configured' },
      { status: 503 }
    )
  }
  try {
    const data = await request.json()
    const settings = await saveSettings(data)
    return NextResponse.json({ ok: true, settings })
  } catch (err) {
    if (err.status === 503) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}