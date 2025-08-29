// app/dashboard/page.tsx
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from "../lib/supabaseClient";
import DashboardClient from "./DashboardClient";

interface Peptide {
  id: string;
  name: string;
  short_description: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  role: string;
}

async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabaseServer.from("adm_profile").select("*");
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return (data as UserProfile[]) || [];
}

async function getPeptideList(): Promise<Peptide[]> {
  const { data, error } = await supabaseServer
    .from("peptides")
    .select("id, name, short_description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching peptide list:", error);
    return [];
  }
  return (data as Peptide[]) || [];
}

export default async function DashboardPage() {
  const { userId } = await auth(); 
  if (!userId) {
    return null;
  }

  // The server will run these in parallel, and the page will wait for both to complete.
  const [users, peptides] = await Promise.all([
    getAllUsers(),
    getPeptideList(),
  ]);

  return <DashboardClient users={users} peptides={peptides} />;
}