import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url, key) : null;
export function requireDatabase() {
  if (!supabase)
    throw new Error(
      "Supabase is not configured. Add the project URL and anon key to .env.",
    );
  return supabase;
}
