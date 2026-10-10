import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { ReturnRequest } from '@/lib/models'
import { getUser } from '@/lib/auth'

export async function PATCH(request, { params }) {
  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  const conn = await connectDb()
  if (!conn) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
  }

  const user = await getUser()
  if (!user || user.role !== 'host') {
    return NextResponse.json({ error: 'Only the store host can review return requests' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status, hostNote } = body

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be either accepted or rejected' }, { status: 400 })
    }

    const ret = await ReturnRequest.findById(id)
    if (!ret) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
    }

    ret.status = status
    ret.hostNote = String(hostNote || '')
    ret.reviewedAt = new Date()
    ret.reviewedBy = user.email || 'Host'
    await ret.save()

    return NextResponse.json({ ok: true, request: ret })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to update request' }, { status: 500 })
  }
}
