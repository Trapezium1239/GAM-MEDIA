import { NextResponse } from 'next/server'
import { ShiftSwapRequestSchema } from '@/lib/validations/schemas'
import { secureApi, requireAdminRole } from '@/lib/security/api'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-static'

async function handler(req: Request) {
  const guard = await requireAdminRole(req)
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = ShiftSwapRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: shift, error: shiftErr } = await supabase
    .from('roster_shifts')
    .select('*')
    .eq('id', parsed.data.shift_id)
    .single()

  if (shiftErr || !shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })

  if (parsed.data.action === 'request_swap') {
    if (shift.user_id !== user.id) return NextResponse.json({ error: 'Not your shift' }, { status: 403 })
    if (shift.status !== 'assigned') return NextResponse.json({ error: 'Shift not available for swap' }, { status: 400 })

    const { error } = await supabase
      .from('roster_shifts')
      .update({ status: 'swap_requested', swap_reason: parsed.data.swap_reason })
      .eq('id', parsed.data.shift_id)

    if (error) return NextResponse.json({ error: 'Failed to request swap' }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Swap requested' })
  }

  if (parsed.data.action === 'cover_shift') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('church_group')
      .eq('id', user.id)
      .single()

    if (!profile || profile.church_group !== shift.unit) {
      return NextResponse.json({ error: 'You can only cover shifts in your unit' }, { status: 403 })
    }
    if (shift.user_id === user.id) return NextResponse.json({ error: 'Cannot cover your own shift' }, { status: 400 })
    if (shift.status !== 'swap_requested') return NextResponse.json({ error: 'Shift not available for coverage' }, { status: 400 })

    const { error } = await supabase
      .from('roster_shifts')
      .update({ status: 'covered', covered_by: user.id, covered_at: new Date().toISOString() })
      .eq('id', parsed.data.shift_id)

    if (error) return NextResponse.json({ error: 'Failed to cover shift' }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Shift covered' })
  }

  if (parsed.data.action === 'cancel_swap') {
    if (shift.user_id !== user.id) return NextResponse.json({ error: 'Not your shift' }, { status: 403 })
    if (shift.status !== 'swap_requested') return NextResponse.json({ error: 'No active swap request' }, { status: 400 })

    const { error } = await supabase
      .from('roster_shifts')
      .update({ status: 'assigned', swap_reason: null })
      .eq('id', parsed.data.shift_id)

    if (error) return NextResponse.json({ error: 'Failed to cancel swap' }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Swap request cancelled' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(req: Request) {
  return secureApi(req, handler)
}