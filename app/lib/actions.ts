// app/lib/actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Use the service role key for this server action
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateRole(userId: string, newRole: string) {
  const { error } = await supabase
    .from("adm_profile")
    .update({ role: newRole })
    .eq("clerk_user_id", userId);

  if (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: error.message };
  }

  // Revalidate the dashboard page to show the updated data
  revalidatePath("/dashboard");
  return { success: true };
}