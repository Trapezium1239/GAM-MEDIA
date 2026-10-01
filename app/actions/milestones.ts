'use server'
import { createClient } from '@/lib/supabase/server'
import { MilestoneSchema, MilestoneUpdateSchema } from '@/lib/validations/schemas'

export async function createMilestone(formData: FormData) {
  const parsed = MilestoneSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    category: formData.get('category'),
    target_amount: Number(formData.get('target_amount') || 0),
    target_date: formData.get('target_date') || undefined,
    status: formData.get('status') || 'planned',
    display_order: Number(formData.get('display_order') || 0),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid input' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('project_milestones')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: 'Failed to create milestone' }
  return { success: true, id: data.id }
}

export async function updateMilestone(formData: FormData) {
  const parsed = MilestoneUpdateSchema.safeParse({
    id: formData.get('id'),
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
    category: formData.get('category') || undefined,
    target_amount: formData.get('target_amount') ? Number(formData.get('target_amount')) : undefined,
    current_amount: formData.get('current_amount') ? Number(formData.get('current_amount')) : undefined,
    target_date: formData.get('target_date') || undefined,
    status: formData.get('status') || undefined,
    display_order: formData.get('display_order') ? Number(formData.get('display_order')) : undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid input' }
  }

  const { id, ...updates } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('project_milestones')
    .update(updates)
    .eq('id', id)

  if (error) return { error: 'Failed to update milestone' }
  return { success: true }
}

export async function deleteMilestone(formData: FormData) {
  const id = formData.get('id') as string

  if (!id) return { error: 'Milestone ID required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('project_milestones')
    .delete()
    .eq('id', id)

  if (error) return { error: 'Failed to delete milestone' }
  return { success: true }
}

export async function refreshMilestoneAmounts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase.rpc('refresh_milestone_amounts')

  if (error) return { error: 'Failed to refresh amounts' }
  return { success: true, updated: data }
}