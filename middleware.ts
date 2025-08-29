import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use Supabase service role client (middleware is server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log("📄 Middleware file is being evaluated!");

export default clerkMiddleware(async (auth, req: NextRequest) => {
    console.log("🔥 Middleware running for:", req.nextUrl.pathname);

  const { userId } = await auth();

  if (!userId) {
    console.log("❌ No userId → redirecting to /sign-in");
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    const { data, error } = await supabase
      .from('adm_profile')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    console.log("🔎 Checking access for user:", userId);
    console.log("    ➡️ Supabase result:", data, " error:", error);

    if (error || !data) {
      console.log("❌ No adm_profile entry, redirecting to /");
      return NextResponse.redirect(new URL('/', req.url));
    }

    console.log("✅ Found role:", data.role);

    if (data.role !== 'admin') {
      console.log("⛔ Access denied for role:", data.role, " → redirecting to /");
      return NextResponse.redirect(new URL('/', req.url));
    }

    console.log("🎉 Access granted for ADMIN user:", userId);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}
