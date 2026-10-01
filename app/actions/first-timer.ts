'use server'
import { createClient } from '@/lib/supabase/server'
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

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('first_timers')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: 'Failed to save submission. Try again.' }

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await fetch(`${origin}/api/webhooks/bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET || ''}`,
      },
      body: JSON.stringify({ type: 'first_timer', payload: data }),
    })
  } catch (e) {
    console.error('Bridge notification trigger failed:', e)
  }

  return { success: true, id: data.id }
}