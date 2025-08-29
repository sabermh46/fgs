import { supabaseServer } from "../lib/supabaseClient";
import DashboardClient from "./DashboardClient";

// Fetch all admin profiles (as per existing code)
async function getAllUsers() {
  const { data, error } = await supabaseServer.from("adm_profile").select("*");
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data;
}

// Fetch a list of peptides for the dashboard table
// We'll select only necessary fields for a concise list display
async function getPeptideList() {
  const { data, error } = await supabaseServer
    .from("peptides")
    .select("id, name, short_description, created_at") // Select relevant fields for the list
    .order("created_at", { ascending: false }); // Order by creation date, newest first

  if (error) {
    console.error("Error fetching peptide list:", error);
    return [];
  }
  return data;
}

export default async function DashboardPage() {
  const users = await getAllUsers();
  const peptides = await getPeptideList(); // Fetch peptides for the list

  return <DashboardClient users={users} peptides={peptides} />;
}
