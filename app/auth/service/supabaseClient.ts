import { createClient } from "@supabase/supabase-js";
import { useAuth} from "@clerk/nextjs";

export const getSupabaseClient = async () => {
  const { getToken } = useAuth();
  const token = await getToken({ template: "supabase" });

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
};
