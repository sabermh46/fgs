// app/dashboard/peptide-list.tsx
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";

interface Peptide {
  id: string;
  name: string;
  short_description: string | null;
  created_at: string;
}

interface PeptideListProps {
  peptides: Peptide[];
  onDelete: (id: string) => void; // Callback for delete action
}

export default function PeptideList({ peptides, onDelete }: PeptideListProps) {
  if (peptides.length === 0) {
    return (
      <div className="mt-8 p-6 bg-background rounded-lg text-center text-gray-400">
        <p>No peptides added yet. Click ➕ Add New Peptide to get started!</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-background rounded-lg overflow-hidden border border-border shadow-[0px_0px_20px_10px_rgba(0,0,0,0.1)]">
      <h2 className="text-xl font-semibold p-4 border-b border-gray-700 text-text">Your Peptides</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-accent text-white">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Peptide Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Short Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Added On
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {peptides.map((peptide) => (
              <tr key={peptide.id} className="hover:bg-gray-200 dark:hover:bg-gray-700 duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                  {peptide.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                  {peptide.short_description ? peptide.short_description.substring(0, 100) + (peptide.short_description.length > 100 ? '...' : '') : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                  {format(new Date(peptide.created_at), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/dashboard?q=add_new_peptide&peptide_id=${peptide.id}`}
                    className="text-blue-400 hover:text-blue-300 mr-4 inline-flex items-center"
                    title="Edit Peptide"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only ml-1">Edit</span>
                  </Link>
                  <button
                    onClick={() => onDelete(peptide.id)}
                    className="text-red-500 hover:text-red-400 inline-flex items-center"
                    title="Delete Peptide"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only ml-1">Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
