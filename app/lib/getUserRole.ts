import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUserRole() {
  const { userId } = await auth(); // Property 'userId' does not exist on type 'Promise<SessionAuthWithRedirect<never>>'

  if (!userId) return null;

  const { data, error } = await supabase
    .from("adm_profile")
    .select("role")
    .eq("clerk_user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching role", error);
    return null;
  }

  return data?.role ?? null;
}
