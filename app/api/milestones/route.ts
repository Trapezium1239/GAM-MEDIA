import { NextResponse } from 'next/server'
import { MilestoneSchema, MilestoneUpdateSchema } from '@/lib/validations/schemas'
import { secureApi, requireAdminRole } from '@/lib/security/api'
import { createClient } from '@/lib/supabase/server'

async function handler(req: Request) {
  const guard = await requireAdminRole(req)
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = MilestoneSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_milestones')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id }, { status: 201 })
}

export async function POST(req: Request) {
  return secureApi(req, handler)
}

export async function GET(req: Request) {
  const guard = await requireAdminRole(req)
  if (guard.error) return guard.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 })
  return NextResponse.json(data || [])
}