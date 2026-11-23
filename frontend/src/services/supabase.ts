import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://jyqfjrtycbljgnfuxdvr.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_BWBiX_TLr0PNxo8-Qk5mgw_8PUFOeVT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
