// app/actions/peptide-read-actions.ts
"use server";

import { supabaseServer } from "../lib/supabaseClient"; // Corrected import to use alias

// Define the interfaces for the data structures returned by Supabase queries
interface CategoryMap {
  category_id: string;
}

interface EffectMap {
  effect_id: string;
}

interface BenefitMap {
  benefit_id: string;
}

interface PeptideLink {
  id?: string;
  link_type: 'vendor' | 'learn_more' | 'reference' | 'other';
  url: string;
  label: string | null;
  position: number | null;
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
 * Fetches a single peptide's full details, including its related categories, effects, benefits, and links
 * by performing manual, separate fetches for each relationship.
 * This is a Server Action and runs exclusively on the server, using the service role key.
 *
 * @param peptideId The ID of the peptide to fetch.
 * @returns A promise resolving to the peptide data or null, along with any error.
 */
export async function getPeptideForEditAction(peptideId: string) {
  const supabase = supabaseServer;

  try {
    // 1. Fetch the main peptide data
    const { data: peptideData, error: peptideError } = await supabase
      .from("peptides")
      .select(`id, name, short_description, description`)
      .eq("id", peptideId)
      .single();

    if (peptideError) {
      console.error("Server Action Error (getPeptideForEditAction - main peptide):", peptideError.message);
      return { data: null, error: peptideError.message };
    }
    if (!peptideData) {
      return { data: null, error: "Peptide not found." };
    }

    // 2. Manually fetch related data using separate queries
    const [
      { data: categoryMaps, error: categoryMapError },
      { data: effects, error: effectsError },
      { data: benefits, error: benefitsError },
      { data: links, error: linksError },
    ] = await Promise.all([
      supabase.from("peptide_category_map").select("category_id").eq("peptide_id", peptideId),
      supabase.from("peptide_effects").select("effect_id").eq("peptide_id", peptideId),
      supabase.from("peptide_benefits").select("benefit_id").eq("peptide_id", peptideId),
      supabase.from("peptide_links").select("id, link_type, url, label, position").eq("peptide_id", peptideId),
    ]);

    if (categoryMapError) throw categoryMapError;
    if (effectsError) throw effectsError;
    if (benefitsError) throw benefitsError;
    if (linksError) throw linksError;

    // Transform data to match PeptideFormData structure
    const transformedData = {
      id: peptideData.id,
      name: peptideData.name,
      short_description: peptideData.short_description || "",
      description: peptideData.description || "",
      selected_category_ids: (categoryMaps as CategoryMap[] | null)?.map((item: CategoryMap) => item.category_id) || [],
      selected_effect_ids: (effects as EffectMap[] | null)?.map((item: EffectMap) => item.effect_id) || [],
      selected_benefit_ids: (benefits as BenefitMap[] | null)?.map((item: BenefitMap) => item.benefit_id) || [],
      links: (links as PeptideLink[] | null) || [],
    };

    return { data: transformedData, error: null };
  } catch (caughtError: unknown) { // Catch as unknown
    const errorMessage = getErrorMessage(caughtError); // Use helper to get message
    console.error("Unexpected Server Action Error (getPeptideForEditAction):", errorMessage);
    return { data: null, error: errorMessage };
  }
}