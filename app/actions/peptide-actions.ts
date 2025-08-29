// app/actions/peptide-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "../lib/supabaseClient"; // Secure server-side Supabase client

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

/**
 * Handles the creation or updating of a peptide and its related data.
 * This is a Server Action and runs exclusively on the server.
 */
export async function savePeptideAction(formData: PeptideFormData) {
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

    return { success: true, peptideId: currentPeptideId };
  } catch (error: any) {
    console.error("Server Action Error (savePeptideAction):", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Handles the deletion of a peptide.
 * This is a Server Action and runs exclusively on the server.
 */
export async function deletePeptideAction(peptideId: string) {
    const supabase = supabaseServer; // Use the service role client on the server

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
    } catch (error: any) {
        console.error("Server Action Error (deletePeptideAction):", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Creates a new effect.
 * This is a Server Action and runs exclusively on the server, using the service role key.
 *
 * @param name The name of the new effect.
 * @param description The description of the new effect (optional).
 * @returns A promise resolving to the new effect's data or null, along with any error.
 */
export async function createEffectAction(name: string, description: string | null = null) {
  const supabase = supabaseServer;

  try {
    const { data, error } = await supabase
      .from("effects")
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select("id, name, description") // Select description too
      .single();

    if (error) throw error;

    revalidatePath("/dashboard"); // Revalidate to ensure dropdowns can be updated
    return { success: true, data };
  } catch (error: any) {
    console.error("Server Action Error (createEffectAction):", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a new benefit.
 * This is a Server Action and runs exclusively on the server, using the service role key.
 *
 * @param name The name of the new benefit.
 * @param description The description of the new benefit (optional).
 * @returns A promise resolving to the new benefit's data or null, along with any error.
 */
export async function createBenefitAction(name: string, description: string | null = null) {
  const supabase = supabaseServer;

  try {
    const { data, error } = await supabase
      .from("benefits")
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select("id, name, description") // Select description too
      .single();

    if (error) throw error;

    revalidatePath("/dashboard"); // Revalidate to ensure dropdowns can be updated
    return { success: true, data };
  } catch (error: any) {
    console.error("Server Action Error (createBenefitAction):", error.message);
    return { success: false, error: error.message };
  }
}
