import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key (server-only!)
)

// Define a type for the expected Clerk webhook event structure
// This is a simplified version; a full type would be more complex
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    // Add other relevant properties from Clerk's user.created event payload if needed
  };
  // Add other event types if your webhook handles more events
}

export async function POST(req: Request) {
  const payload = await req.text()
  const headerPayload = await headers()
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  try {
    console.log('📩 Incoming webhook payload:', payload)

    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    // Ensure all required headers are present
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new NextResponse('Error: Missing Svix headers', { status: 400 });
    }

    // Verify the webhook payload
    const evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent; // Assert to our defined interface

    console.log('✅ Verified Clerk event:', evt)

    // The 'evt' object already contains the parsed data, no need for JSON.parse(payload) again
    // const data = JSON.parse(payload) // This line is redundant and can be removed

    // Directly access 'evt.type' as it's now typed
    if (evt.type === 'user.created') {
      const user = evt.data; // Access data directly from the typed evt object
      console.log('👤 New user object:', user);

      const { error } = await supabase.from('adm_profile').insert({
        clerk_user_id: user.id,
        email: user.email_addresses?.[0]?.email_address || null,
        role: 'public', // default
      });

      if (error) {
        console.error('❌ Supabase insert error:', error);
      } else {
        console.log('✅ User inserted into adm_profile');
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) { // Catch as unknown for better type safety
    let errorMessage = "Webhook handler error.";
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    console.error('❌ Webhook handler error:', errorMessage);
    return new NextResponse('Error', { status: 400 });
  }
}