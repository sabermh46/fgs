// app/actions/peptide-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "../lib/supabaseClient"; // Corrected import to use alias

interface PeptideFormData {
  id?: string; // Optional for update
  name: string;
  short_description: string;
  description: string;
  selected_category_ids: string[];
  selected_effect_ids: string[];
  selected_benefit_ids: string[];
  links: {
    id?: string;
    link_type: 'vendor' | 'learn_more' | 'reference' | 'other';
    url: string;
    label: string | null;
    position: number | null;
  }[];
}

interface ActionResponse<T = undefined> { // Changed default T to undefined, as data might not always be present
  success: boolean;
  error?: string;
  data?: T;
}

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

/**
 * Handles the creation or updating of a peptide and its related data.
 * This is a Server Action and runs exclusively on the server.
 * @param formData The data for the peptide to save.
 * @returns A promise resolving to an ActionResponse indicating success or failure.
 */
export async function savePeptideAction(formData: PeptideFormData): Promise<ActionResponse<{ peptideId: string }>> {
  const {
    id: peptideId, // id from formData if updating, otherwise it's undefined
    name,
    short_description,
    description,
    selected_category_ids,
    selected_effect_ids,
    selected_benefit_ids,
    links,
  } = formData;

  const supabase = supabaseServer; // Use the service role client on the server

  try {
    let currentPeptideId: string;

    if (peptideId) {
      // --- UPDATE EXISTING PEPTIDE ---
      const { error: updatePeptideError } = await supabase
        .from("peptides")
        .update({ name, short_description, description })
        .eq("id", peptideId);
      if (updatePeptideError) throw updatePeptideError;
      currentPeptideId = peptideId;
    } else {
      // --- INSERT NEW PEPTIDE ---
      const { data, error: insertPeptideError } = await supabase
        .from("peptides")
        .insert({ name, short_description, description })
        .select("id")
        .single();
      if (insertPeptideError) throw insertPeptideError;
      currentPeptideId = data.id;
    }

    if (!currentPeptideId) {
      throw new Error("Peptide ID could not be determined for linking.");
    }

    // --- MANAGE MANY-TO-MANY RELATIONSHIPS (Delete old, Insert new) ---
    // Perform deletions in parallel for efficiency
    await Promise.all([
      supabase.from("peptide_category_map").delete().eq("peptide_id", currentPeptideId),
      supabase.from("peptide_effects").delete().eq("peptide_id", currentPeptideId),
      supabase.from("peptide_benefits").delete().eq("peptide_id", currentPeptideId),
      supabase.from("peptide_links").delete().eq("peptide_id", currentPeptideId),
    ]);

    // Insert new category mappings
    const categoryInserts = selected_category_ids.map((categoryId) => ({
      peptide_id: currentPeptideId,
      category_id: categoryId,
    }));
    if (categoryInserts.length > 0) {
      const { error } = await supabase.from("peptide_category_map").insert(categoryInserts);
      if (error) throw error;
    }

    // Insert new effect mappings
    const effectInserts = selected_effect_ids.map((effectId) => ({
      peptide_id: currentPeptideId,
      effect_id: effectId,
    }));
    if (effectInserts.length > 0) {
      const { error } = await supabase.from("peptide_effects").insert(effectInserts);
      if (error) throw error;
    }

    // Insert new benefit mappings
    const benefitInserts = selected_benefit_ids.map((benefitId) => ({
      peptide_id: currentPeptideId,
      benefit_id: benefitId,
    }));
    if (benefitInserts.length > 0) {
      const { error } = await supabase.from("peptide_benefits").insert(benefitInserts);
      if (error) throw error;
    }

    // --- MANAGE PEPTIDE LINKS ---
    const linkInserts = links
      .filter((link) => link.url.trim() !== "") // Only insert links with a URL
      .map((link) => ({
        peptide_id: currentPeptideId,
        link_type: link.link_type,
        url: link.url.trim(),
        label: link.label?.trim() || null,
        position: link.position || null,
      }));

    if (linkInserts.length > 0) {
      const { error } = await supabase.from("peptide_links").insert(linkInserts);
      if (error) throw error;
    }

    // Revalidate the dashboard path to show updated list
    revalidatePath("/dashboard");

    return { success: true, data: { peptideId: currentPeptideId } };
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("Server Action Error (savePeptideAction):", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Handles the deletion of a peptide.
 * This is a Server Action and runs exclusively on the server.
 * @param peptideId The ID of the peptide to delete.
 * @returns A promise resolving to an ActionResponse indicating success or failure.
 */
export async function deletePeptideAction(peptideId: string): Promise<ActionResponse> {
    const supabase = supabaseServer;

    try {
        const { error } = await supabase
            .from("peptides")
            .delete()
            .eq("id", peptideId);

        if (error) {
            throw error;
        }

        // Revalidate the dashboard path to show updated list
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        console.error("Server Action Error (deletePeptideAction):", errorMessage);
        return { success: false, error: errorMessage };
    }
}

interface EffectData {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Creates a new effect.
 * This is a Server Action and runs exclusively on the server, using the service role key.
 * @param name The name of the new effect.
 * @param description The description of the new effect (optional).
 * @returns A promise resolving to an ActionResponse containing the new effect's data or an error.
 */
export async function createEffectAction(name: string, description: string | null = null): Promise<ActionResponse<EffectData>> {
  const supabase = supabaseServer;

  try {
    const { data, error } = await supabase
      .from("effects")
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select("id, name, description")
      .single();

    if (error) throw error;

    revalidatePath("/dashboard"); // Revalidate to ensure dropdowns can be updated
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("Server Action Error (createEffectAction):", errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface BenefitData {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Creates a new benefit.
 * This is a Server Action and runs exclusively on the server, using the service role key.
 * @param name The name of the new benefit.
 * @param description The description of the new benefit (optional).
 * @returns A promise resolving to an ActionResponse containing the new benefit's data or an error.
 */
export async function createBenefitAction(name: string, description: string | null = null): Promise<ActionResponse<BenefitData>> {
  const supabase = supabaseServer;

  try {
    const { data, error } = await supabase
      .from("benefits")
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select("id, name, description")
      .single();

    if (error) throw error;

    revalidatePath("/dashboard"); // Revalidate to ensure dropdowns can be updated
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("Server Action Error (createBenefitAction):", errorMessage);
    return { success: false, error: errorMessage };
  }
}