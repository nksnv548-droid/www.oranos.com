const SUPABASE_URL = "https://pbohqygrzesddmgmrfma.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OSKC6mR5O2iHPG1g63tyXA_wtd1y7oX";
export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_PUBLISHABLE_KEY,
  };
}
