// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// This function is for server-side use only.
// It will have access to the service role key.
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);