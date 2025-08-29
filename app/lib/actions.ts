// app/lib/actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Use the service role key for this server action
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Helper function to safely extract an error message from an unknown error type.
 * @param error The caught error object.
 * @returns A string message for the error.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  // Fallback for cases where error is not an Error instance but might have a message property
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return "An unknown error occurred.";
}

export async function updateRole(userId: string, newRole: string) {
  try {
    const { error } = await supabase
      .from("adm_profile")
      .update({ role: newRole })
      .eq("clerk_user_id", userId);

    if (error) {
      console.error("Error updating user role:", error.message); // Access error.message
      return { success: false, error: error.message }; // Return error.message as string
    }

    // Revalidate the dashboard page to show the updated data
    revalidatePath("/dashboard");
    return { success: true };
  } catch (caughtError: unknown) { // Catch as unknown
    const errorMessage = getErrorMessage(caughtError); // Use helper to get message
    console.error("Error updating user role:", errorMessage);
    return { success: false, error: errorMessage };
  }
}