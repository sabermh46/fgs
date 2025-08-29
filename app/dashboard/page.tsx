// app/dashboard/page.tsx
import { Suspense } from 'react';
import { auth, clerkClient } from '@clerk/nextjs/server'; // Import auth and clerkClient
import { supabaseServer } from "../lib/supabaseClient";
import DashboardClient from "./DashboardClient";

// Define an interface for the peptide data
interface Peptide {
  id: string;
  name: string;
  short_description: string | null;
  created_at: string;
}

// Define an interface for the user profile data
interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  role: string;
}

// Fetch all admin profiles
async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabaseServer.from("adm_profile").select("*");
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  // Type assertion for the returned data
  return (data as UserProfile[]) || [];
}

// Fetch a list of peptides for the dashboard table
async function getPeptideList(): Promise<Peptide[]> {
  const { data, error } = await supabaseServer
    .from("peptides")
    .select("id, name, short_description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching peptide list:", error);
    return [];
  }
  // Type assertion for the returned data
  return (data as Peptide[]) || [];
}

export default async function DashboardPage() {
  const { userId } = await auth(); // Get the userId from Clerk's auth() helper

  // If there is no authenticated user, Clerk will handle the redirect.
  // We can return null to avoid rendering any UI for unauthenticated users.
  if (!userId) {
    return null;
  }

  // Optionally fetch the full user object if needed for the page, though not strictly
  // required by DashboardClientProps which only needs userId for filtering.
  // const user = await clerkClient.users.getUser(userId);

  const users = await getAllUsers();
  const peptides = await getPeptideList();

  return (
    // Wrap the client component in a Suspense boundary to handle client-side hooks.
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardClient users={users} peptides={peptides} />
    </Suspense>
  );
}