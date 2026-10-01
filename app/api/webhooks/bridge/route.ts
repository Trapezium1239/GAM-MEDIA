import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { secureCompare } from '@/lib/security/api'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    if (!secureCompare(token, process.env.CRON_SECRET || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createAdminClient()

    const { data: channels } = await supabase
      .from('bridge_channels')
      .select('*')
      .eq('is_active', true)

    if (!channels || channels.length === 0) {
      return NextResponse.json({ status: 'no_channels' })
    }

    let text = ''
    if (body.type === 'alert') {
      const p = body.payload
      text = `🚨 *${p.title}*\n${p.message}\n_Target: ${p.target_group}_`
    } else if (body.type === 'first_timer') {
      const p = body.payload
      text = `👋 *New First-Timer Alert!*\nName: ${p.full_name}\nInterest: ${p.interested_unit}\nPhone: ${p.phone}`
    }

    if (!text) {
      return NextResponse.json({ status: 'no_message' })
    }

    const results = await Promise.allSettled(
      channels.map(async (ch: { platform: string; channel_id: string }) => {
        if (ch.platform === 'telegram' && process.env.TELEGRAM_BOT_TOKEN) {
          return fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: ch.channel_id,
                text,
                parse_mode: 'Markdown',
              }),
            }
          )
        }
        return null
      })
    )

    return NextResponse.json({ status: 'dispatched', results: results.length })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}