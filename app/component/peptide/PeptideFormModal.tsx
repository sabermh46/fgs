// app/component/peptide/peptide-form-modal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, ExternalLink } from "lucide-react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import {
  savePeptideAction,
  createEffectAction,
  createBenefitAction,
} from "../../actions/peptide-actions";
import { getPeptideForEditAction } from "../../actions/peptide-read-actions";

interface Category {
  id: string;
  name: string;
}

type ActiveTab = "general" | "details" | "properties" | "links";
interface Effect {
  id: string;
  name: string;
  description: string | null;
}

interface Benefit {
  id: string;
  name: string;
  description: string | null;
}

interface PeptideLink {
  id?: string;
  link_type: 'vendor' | 'learn_more' | 'reference' | 'other';
  url: string;
  label: string | null;
  position: number | null;
}

const initialLink: PeptideLink = {
  link_type: 'vendor',
  url: '',
  label: '',
  position: null,
};

interface PeptideFormData {
  id?: string;
  name: string;
  short_description: string;
  description: string;
  selected_category_ids: string[];
  selected_effect_ids: string[];
  selected_benefit_ids: string[];
  links: PeptideLink[];
}

interface PeptideFormModalProps {
  onClose: () => void;
  peptideId?: string;
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
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return "An unknown error occurred.";
}

export default function PeptideFormModal({ onClose, peptideId }: PeptideFormModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [formData, setFormData] = useState<PeptideFormData>({
    name: "",
    short_description: "",
    description: "",
    selected_category_ids: [],
    selected_effect_ids: [],
    selected_benefit_ids: [],
    links: [{ ...initialLink }],
  });
  const [charCount, setCharCount] = useState<Record<string, number>>({});
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allEffects, setAllEffects] = useState<Effect[]>([]);
  const [allBenefits, setAllBenefits] = useState<Benefit[]>([]);
  const [loadingInitialOptions, setLoadingInitialOptions] = useState<boolean>(true);
  const [loadingPeptideData, setLoadingPeptideData] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [newEffectName, setNewEffectName] = useState<string>('');
  const [newEffectDescription, setNewEffectDescription] = useState<string>('');
  const [newBenefitName, setNewBenefitName] = useState<string>('');
  const [newBenefitDescription, setNewBenefitDescription] = useState<string>('');
  const [isAddingEffect, setIsAddingEffect] = useState<boolean>(false);
  const [isAddingBenefit, setIsAddingBenefit] = useState<boolean>(false);

  const fetchOptions = useCallback(async () => {
    setLoadingInitialOptions(true);
    try {
      const [
        { data: categoriesData, error: categoriesError },
        { data: effectsData, error: effectsError },
        { data: benefitsData, error: benefitsError },
      ] = await Promise.all([
        supabaseBrowser.from("categories").select("id, name").order("name"),
        supabaseBrowser.from("effects").select("id, name, description").order("name"),
        supabaseBrowser.from("benefits").select("id, name, description").order("name"),
      ]);

      if (categoriesError) throw categoriesError;
      if (effectsError) throw effectsError;
      if (benefitsError) throw benefitsError;

      setAllCategories(categoriesData || []);
      setAllEffects(effectsData || []);
      setAllBenefits(benefitsData || []);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching options:", errorMessage);
      setFormError("Failed to load form options.");
    } finally {
      setLoadingInitialOptions(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    async function fetchPeptideForEdit() {
      if (!peptideId || loadingInitialOptions) {
        setLoadingPeptideData(false);
        return;
      }

      setLoadingPeptideData(true);
      setFormError(null);

      try {
        const result = await getPeptideForEditAction(peptideId);

        if (result.error) {
          throw new Error(result.error);
        }
        if (!result.data) {
          setFormError("Peptide not found.");
          return;
        }

        const peptideData = result.data;

        setFormData({
          id: peptideData.id,
          name: peptideData.name,
          short_description: peptideData.short_description || "",
          description: peptideData.description || "",
          selected_category_ids: peptideData.selected_category_ids,
          selected_effect_ids: peptideData.selected_effect_ids,
          selected_benefit_ids: peptideData.selected_benefit_ids,
          links: peptideData.links.length > 0 ? peptideData.links : [{ ...initialLink }],
        });

        setCharCount({
          name: peptideData.name.length,
          short_description: (peptideData.short_description || "").length,
          description: (peptideData.description || "").length,
        });

      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        console.error("Error fetching peptide for edit:", errorMessage);
        setFormError("Failed to load peptide data for editing: " + errorMessage);
      } finally {
        setLoadingPeptideData(false);
      }
    }

    fetchPeptideForEdit();
  }, [peptideId, loadingInitialOptions]);

  const handleChange = useCallback((field: string, value: string, maxLength?: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (maxLength && typeof value === 'string') {
      setCharCount((prev) => ({ ...prev, [field]: value.length }));
    }
  }, []);

  const handleMultiSelectChange = useCallback((
    field: "selected_category_ids" | "selected_effect_ids" | "selected_benefit_ids",
    optionId: string,
    isChecked: boolean
  ) => {
    setFormData((prev) => {
      const currentIds = prev[field] || [];
      if (isChecked) {
        return { ...prev, [field]: [...currentIds, optionId] };
      } else {
        return { ...prev, [field]: currentIds.filter((id: string) => id !== optionId) };
      }
    });
  }, []);

  const handleLinkChange = useCallback((
    index: number,
    field: keyof PeptideLink,
    value: string | number | null
  ) => {
    setFormData((prev) => {
      const newLinks = [...prev.links];
      if (field === 'position') {
        newLinks[index] = { ...newLinks[index], [field]: value === '' ? null : Number(value) };
      } else {
        newLinks[index] = { ...newLinks[index], [field]: value };
      }
      return { ...prev, links: newLinks };
    });
  }, []);

  const addLinkRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, { ...initialLink }],
    }));
  }, []);

  const removeLinkRow = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  }, []);

  const handleAddEffect = async () => {
    if (!newEffectName.trim()) {
      setFormError("Effect name cannot be empty.");
      return;
    }
    setIsAddingEffect(true);
    setFormError(null);

    try {
      const result = await createEffectAction(newEffectName, newEffectDescription);
      if (result.success && result.data) {
        setAllEffects((prev) => [...prev, result.data!]);
        setFormData((prev) => ({
            ...prev,
            selected_effect_ids: [...prev.selected_effect_ids, result.data!.id]
        }));
        setNewEffectName('');
        setNewEffectDescription('');
      } else {
        throw new Error(result.error || "Failed to add new effect.");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error("Error adding effect:", errorMessage);
      setFormError(`Failed to add new effect: ${errorMessage}`);
    } finally {
      setIsAddingEffect(false);
    }
  };

  const handleAddBenefit = async () => {
    if (!newBenefitName.trim()) {
      setFormError("Benefit name cannot be empty.");
      return;
    }
    setIsAddingBenefit(true);
    setFormError(null);

    try {
      const result = await createBenefitAction(newBenefitName, newBenefitDescription);
      if (result.success && result.data) {
        setAllBenefits((prev) => [...prev, result.data!]);
        setFormData((prev) => ({
            ...prev,
            selected_benefit_ids: [...prev.selected_benefit_ids, result.data!.id]
        }));
        setNewBenefitName('');
        setNewBenefitDescription('');
      } else {
        throw new Error(result.error || "Failed to add new benefit.");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error("Error adding benefit:", errorMessage);
      setFormError(`Failed to add new benefit: ${errorMessage}`);
    } finally {
      setIsAddingBenefit(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const result = await savePeptideAction(formData);

    if (result.success) {
      console.log("Form submitted successfully!");
      onClose();
    } else {
      console.error("Submission error:", result.error);
      setFormError(`Failed to save peptide: ${result.error}`);
    }
    setIsSubmitting(false);
  };

  const isLoading = loadingInitialOptions || (peptideId && loadingPeptideData);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading peptide data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center backdrop-blur-sm justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center border-b border-gray-700 p-4 bg-gray-800">
          <h2 className="text-xl font-semibold text-white">
            {peptideId ? "Edit Peptide" : "Add New Peptide"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-700 bg-gray-800 text-white">
        {["general", "details", "properties", "links"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as ActiveTab)}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-200"
            } transition-colors duration-200`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

        <form onSubmit={handleSubmit} className="flex-grow p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {formError && (
            <div className="bg-red-800 text-white p-3 rounded-md text-sm">
              {formError}
            </div>
          )}

          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col md:col-span-2">
                <label htmlFor="name" className="text-sm font-medium mb-1 text-gray-300">Peptide Name<span className="text-red-500">*</span></label>
                <input
                  id="name"
                  type="text"
                  maxLength={2000}
                  className="border border-gray-700 bg-gray-800 text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value, 2000)}
                />
                <span className="text-xs text-gray-500 mt-1">
                  [{charCount.name || 0}/2000]
                </span>
              </div>
              <div className="flex flex-col md:col-span-2">
                <label htmlFor="short_description" className="text-sm font-medium mb-1 text-gray-300">Short Description</label>
                <textarea
                  id="short_description"
                  maxLength={500}
                  rows={3}
                  className="border border-gray-700 bg-gray-800 text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  value={formData.short_description}
                  onChange={(e) => handleChange("short_description", e.target.value, 500)}
                ></textarea>
                <span className="text-xs text-gray-500 mt-1">
                  [{charCount.short_description || 0}/500]
                </span>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="flex flex-col">
                <label htmlFor="description" className="text-sm font-medium mb-1 text-gray-300">Full Description</label>
                <textarea
                  id="description"
                  maxLength={5000}
                  rows={10}
                  className="border border-gray-700 bg-gray-800 text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value, 5000)}
                ></textarea>
                <span className="text-xs text-gray-500 mt-1">
                  [{charCount.description || 0}/5000]
                </span>
              </div>
            </div>
          )}

          {activeTab === "properties" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-2 text-gray-300">Categories</label>
                <div className="border border-gray-700 bg-gray-800 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {allCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`cat-${cat.id}`}
                        className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        checked={formData.selected_category_ids.includes(cat.id)}
                        onChange={(e) =>
                          handleMultiSelectChange("selected_category_ids", cat.id, e.target.checked)
                        }
                      />
                      <label htmlFor={`cat-${cat.id}`} className="ml-2 text-sm text-gray-200">
                        {cat.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-2 text-gray-300">Effects</label>
                <div className="border border-gray-700 bg-gray-800 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {allEffects.map((effect) => (
                    <div key={effect.id} className="flex items-center group">
                      <input
                        type="checkbox"
                        id={`effect-${effect.id}`}
                        className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        checked={formData.selected_effect_ids.includes(effect.id)}
                        onChange={(e) =>
                          handleMultiSelectChange("selected_effect_ids", effect.id, e.target.checked)
                        }
                      />
                      <label htmlFor={`effect-${effect.id}`} className="ml-2 text-sm text-gray-200 cursor-help">
                        {effect.name}
                        {effect.description && (
                            <span className="ml-1 text-gray-500 text-xs italic opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                ({effect.description.substring(0, 50)}{effect.description.length > 50 ? '...' : ''})
                            </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                    <input
                        type="text"
                        className="border border-gray-600 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        placeholder="New effect name"
                        value={newEffectName}
                        onChange={(e) => setNewEffectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEffect();
                          }
                        }}
                        disabled={isAddingEffect}
                    />
                    <textarea
                        rows={2}
                        className="border border-gray-600 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-y"
                        placeholder="Description (optional)"
                        value={newEffectDescription}
                        onChange={(e) => setNewEffectDescription(e.target.value)}
                        disabled={isAddingEffect}
                    ></textarea>
                    <button
                        type="button"
                        onClick={handleAddEffect}
                        className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
                        disabled={isAddingEffect || !newEffectName.trim()}
                    >
                        {isAddingEffect ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5 mr-2" /> Add Effect
                            </>
                        )}
                    </button>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-2 text-gray-300">Benefits</label>
                <div className="border border-gray-700 bg-gray-800 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {allBenefits.map((benefit) => (
                    <div key={benefit.id} className="flex items-center group">
                      <input
                        type="checkbox"
                        id={`benefit-${benefit.id}`}
                        className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        checked={formData.selected_benefit_ids.includes(benefit.id)}
                        onChange={(e) =>
                          handleMultiSelectChange("selected_benefit_ids", benefit.id, e.target.checked)
                        }
                      />
                      <label htmlFor={`benefit-${benefit.id}`} className="ml-2 text-sm text-gray-200 cursor-help">
                        {benefit.name}
                        {benefit.description && (
                            <span className="ml-1 text-gray-500 text-xs italic opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                ({benefit.description.substring(0, 50)}{benefit.description.length > 50 ? '...' : ''})
                            </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                    <input
                        type="text"
                        className="border border-gray-600 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        placeholder="New benefit name"
                        value={newBenefitName}
                        onChange={(e) => setNewBenefitName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBenefit();
                          }
                        }}
                        disabled={isAddingBenefit}
                    />
                    <textarea
                        rows={2}
                        className="border border-gray-600 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-y"
                        placeholder="Description (optional)"
                        value={newBenefitDescription}
                        onChange={(e) => setNewBenefitDescription(e.target.value)}
                        disabled={isAddingBenefit}
                    ></textarea>
                    <button
                        type="button"
                        onClick={handleAddBenefit}
                        className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
                        disabled={isAddingBenefit || !newBenefitName.trim()}
                    >
                        {isAddingBenefit ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5 mr-2" /> Add Benefit
                            </>
                        )}
                    </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "links" && (
            <div className="space-y-6">
              {formData.links.map((link, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-700 rounded-lg bg-gray-800 relative">
                    <button
                        type="button"
                        onClick={() => removeLinkRow(index)}
                        className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-300 rounded-full bg-gray-700 hover:bg-gray-600 transition"
                        title="Remove Link"
                    >
                        <X className="h-4 w-4" />
                    </button>
                  <div className="flex flex-col md:col-span-1">
                    <label htmlFor={`link-type-${index}`} className="text-sm font-medium mb-1 text-gray-300">Link Type</label>
                    <select
                      id={`link-type-${index}`}
                      className="border border-gray-600 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={link.link_type}
                      onChange={(e) => handleLinkChange(index, "link_type", e.target.value as PeptideLink['link_type'])}
                    >
                      <option value="vendor">Vendor</option>
                      <option value="learn_more">Learn More</option>
                      <option value="reference">Reference</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label htmlFor={`link-url-${index}`} className="text-sm font-medium mb-1 text-gray-300">URL<span className="text-red-500">*</span></label>
                    <div className="flex items-center">
                      <input
                        id={`link-url-${index}`}
                        type="url"
                        required={link.url.trim() !== ''}
                        className="flex-grow border border-gray-600 bg-gray-700 text-white p-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                        placeholder="https://example.com"
                      />
                      {link.url && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg ml-px"
                          title="Open Link"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col md:col-span-1">
                    <label htmlFor={`link-label-${index}`} className="text-sm font-medium mb-1 text-gray-300">Label (Optional)</label>
                    <input
                      id={`link-label-${index}`}
                      type="text"
                      className="border border-gray-600 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={link.label || ''}
                      onChange={(e) => handleLinkChange(index, "label", e.target.value)}
                      placeholder="e.g., Product Page"
                    />
                  </div>
                  <div className="flex flex-col md:col-span-1">
                    <label htmlFor={`link-position-${index}`} className="text-sm font-medium mb-1 text-gray-300">Position (Optional)</label>
                    <input
                      id={`link-position-${index}`}
                      type="number"
                      className="border border-gray-600 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={link.position || ''}
                      onChange={(e) => handleLinkChange(index, "position", e.target.value)}
                      min="1"
                      placeholder="1"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addLinkRow}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" /> Add Another Link
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-700 bg-gray-900 sticky bottom-0 z-10 -mx-6 px-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                peptideId ? "Update Peptide" : "Save Peptide"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}