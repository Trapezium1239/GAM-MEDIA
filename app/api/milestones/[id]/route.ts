import { NextResponse } from 'next/server'
import { MilestoneUpdateSchema } from '@/lib/validations/schemas'
import { secureApi, requireAdminRole } from '@/lib/security/api'
import { createClient } from '@/lib/supabase/server'

async function patchHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(req)
  if (guard.error) return guard.error

  const { id } = await params
  const body = await req.json()
  const parsed = MilestoneUpdateSchema.safeParse({ ...body, id })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { id: _, ...updates } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from('project_milestones').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  return NextResponse.json({ success: true })
}

async function deleteHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(req)
  if (guard.error) return guard.error

  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('project_milestones').delete().eq('id', id)

  if (error) return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return secureApi(req, (r) => patchHandler(r, { params }))
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return secureApi(req, (r) => deleteHandler(r, { params }))
}