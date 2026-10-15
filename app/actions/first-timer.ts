// Client-side submission helper (no server runtime — static export).
import { createClient } from '@/lib/supabase/client'
import { FirstTimerSchema } from '@/lib/validations/schemas'

export async function submitFirstTimer(formData: FormData) {
  const parsed = FirstTimerSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    is_first_time: formData.get('is_first_time') === 'on',
    prayer_request: formData.get('prayer_request') || undefined,
    interested_unit: formData.get('interested_unit') || 'general',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid input' }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('first_timers')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: 'Failed to save submission. Try again.' }

  return { success: true, id: data.id }
}