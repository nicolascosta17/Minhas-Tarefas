import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://dbzgcydwevpjsfindwcx.supabase.co';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_SJIFc-jOXfQdYJjrkH334A_UAw3_1uG';

// Chave publishable é pública; a segurança dos dados é aplicada por RLS.
export const supabase = createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

export function expectData({ data, error }) {
  if (error) throw error;
  return data;
}
