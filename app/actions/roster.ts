'use server'
import { createClient } from '@/lib/supabase/server'
import { ShiftSwapRequestSchema } from '@/lib/validations/schemas'

export async function requestShiftSwap(formData: FormData) {
  const parsed = ShiftSwapRequestSchema.safeParse({
    shift_id: formData.get('shift_id'),
    action: formData.get('action'),
    swap_reason: formData.get('swap_reason') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid input' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Get the shift
  const { data: shift, error: shiftErr } = await supabase
    .from('roster_shifts')
    .select('*')
    .eq('id', parsed.data.shift_id)
    .single()

  if (shiftErr || !shift) return { error: 'Shift not found' }

  if (parsed.data.action === 'request_swap') {
    // Only the assigned user can request swap
    if (shift.user_id !== user.id) return { error: 'Not your shift' }
    if (shift.status !== 'assigned') return { error: 'Shift not available for swap' }

    const { error } = await supabase
      .from('roster_shifts')
      .update({ status: 'swap_requested', swap_reason: parsed.data.swap_reason })
      .eq('id', parsed.data.shift_id)

    if (error) return { error: 'Failed to request swap' }
    return { success: true, message: 'Swap requested. Waiting for coverage.' }
  }

  if (parsed.data.action === 'cover_shift') {
    // Only someone in the same unit can cover, and not the original user
    const { data: profile } = await supabase
      .from('profiles')
      .select('church_group')
      .eq('id', user.id)
      .single()

    if (!profile || profile.church_group !== shift.unit) {
      return { error: 'You can only cover shifts in your unit' }
    }
    if (shift.user_id === user.id) return { error: 'Cannot cover your own shift' }
    if (shift.status !== 'swap_requested') return { error: 'Shift not available for coverage' }

    const { error } = await supabase
      .from('roster_shifts')
      .update({
        status: 'covered',
        covered_by: user.id,
        covered_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.shift_id)

    if (error) return { error: 'Failed to cover shift' }
    return { success: true, message: 'Shift covered successfully!' }
  }

  if (parsed.data.action === 'cancel_swap') {
    // Only the assigned user can cancel their swap request
    if (shift.user_id !== user.id) return { error: 'Not your shift' }
    if (shift.status !== 'swap_requested') return { error: 'No active swap request' }

    const { error } = await supabase
      .from('roster_shifts')
      .update({ status: 'assigned', swap_reason: null })
      .eq('id', parsed.data.shift_id)

    if (error) return { error: 'Failed to cancel swap request' }
    return { success: true, message: 'Swap request cancelled' }
  }

  return { error: 'Invalid action' }
}