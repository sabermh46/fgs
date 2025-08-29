import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key (server-only!)
)

export async function POST(req: Request) {
  const payload = await req.text()
  const headerPayload = headers()
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  try {
    console.log('📩 Incoming webhook payload:', payload)

    const evt = wh.verify(payload, {
      'svix-id': (await headerPayload).get('svix-id')!,
      'svix-timestamp': (await headerPayload).get('svix-timestamp')!,
      'svix-signature': (await headerPayload).get('svix-signature')!,
    })

    console.log('✅ Verified Clerk event:', evt)

    const data = JSON.parse(payload)

    if (
      typeof evt === 'object' &&
      evt !== null &&
      'type' in evt &&
      typeof (evt as { type: unknown }).type === 'string'
    ) {
      console.log('📌 Event type:', (evt as { type: string }).type)

      if ((evt as { type: string }).type === 'user.created') {
        const user = data.data
        console.log('👤 New user object:', user)

        const { error } = await supabase.from('adm_profile').insert({
          clerk_user_id: user.id,
          email: user.email_addresses?.[0]?.email_address || null,
          role: 'public', // default
        })

        if (error) {
          console.error('❌ Supabase insert error:', error)
        } else {
          console.log('✅ User inserted into adm_profile')
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('❌ Webhook handler error:', err)
    return new NextResponse('Error', { status: 400 })
  }
}
