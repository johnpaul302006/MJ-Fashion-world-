import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { getSettings } from '@/lib/data'

export async function GET() {
  const user = await getUser()
  const settings = await getSettings()
  return NextResponse.json({
    user,
    offers: settings.offers || [],
    announcements: settings.announcements || [],
    announcement: settings.announcement || '',
  })
}