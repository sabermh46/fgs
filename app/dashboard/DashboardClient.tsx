// app/dashboard/dashboard-client.tsx
"use client";

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import ManageUsersModal from "../component/manageUsers/ManageUsersModal";
import PeptideList from "./peptide-list";
import PeptideFormModal from "../component/peptide/PeptideFormModal";
import { deletePeptideAction } from "../actions/peptide-actions";

interface Peptide {
  id: string;
  name: string;
  short_description: string | null;
  created_at: string;
}

interface DashboardClientProps {
  users: any[];
  peptides: Peptide[];
}

export default function DashboardClient({ users, peptides }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showPeptideModal = searchParams.get("q") === "add_new_peptide";
  const editingPeptideId = searchParams.get("peptide_id");
  const showManageUsersModal = searchParams.get("q") === "manage_users";

  const handleDeletePeptide = async (peptideId: string) => {
    if (window.confirm("Are you sure you want to delete this peptide? This action cannot be undone.")) {
      try {
        const result = await deletePeptideAction(peptideId);
        
        if (result.success) {
          console.log(`Peptide with ID ${peptideId} deleted successfully.`);
          router.refresh();
        } else {
          throw new Error(result.error || "Unknown error during deletion.");
        }
      } catch (error: any) {
        console.error("Error deleting peptide:", error.message);
        alert(`Failed to delete peptide: ${error.message}`);
      }
    }
  };

  return (
    <>
      <SignedIn>
        <main className="p-6 bg-background min-h-screen text-white">
          <h1 className="text-4xl font-extrabold text-blue-400 mb-4">Dashboard</h1>
          <p className="text-lg text-text">
            Manage your peptides and user profiles here.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard?q=add_new_peptide"
              className="inline-flex items-center rounded-xl bg-accent px-6 py-3 text-white font-medium shadow-lg hover:bg-accent-hover transition transform hover:scale-105"
            >
              ➕ Add New Peptide
            </Link>
            <Link
              href="/dashboard?q=manage_users"
              className="inline-flex items-center rounded-xl bg-green-600 px-6 py-3 text-white font-medium shadow-lg hover:bg-green-700 transition transform hover:scale-105"
            >
              👥 Manage Users
            </Link>
          </div>

          <PeptideList peptides={peptides} onDelete={handleDeletePeptide} />

          {showPeptideModal && (
            <PeptideFormModal
              onClose={() => router.push('/dashboard')}
              peptideId={editingPeptideId || undefined}
            />
          )}

          {showManageUsersModal && (
            <ManageUsersModal
                isOpen={true}
              users={users}
              onClose={() => router.push('/dashboard')}
            />
          )}
        </main>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}