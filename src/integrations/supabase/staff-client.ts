import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) throw new Error("Konfigurasi layanan login staff tidak tersedia");

export const staffSupabase = createClient<Database>(url, key, {
  auth: {
    storageKey: "safar-iman-staff-auth-token",
    persistSession: true,
    autoRefreshToken: true,
  },
});