import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://qlfizttqpovyvurkrxvs.supabase.co';
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                    env.VITE_SUPABASE_ANON_KEY || 
                    'sb_publishable_m8BNtlAkk74xfl8VB2Sjtg_B841bHPs';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[MediConnect Supabase] Missing Supabase environment variables! ' +
    'Please verify VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env'
  );
}

const authConfig = {
  persistSession: typeof window !== 'undefined',
  autoRefreshToken: typeof window !== 'undefined',
  detectSessionInUrl: typeof window !== 'undefined'
};

if (typeof window !== 'undefined' && window.localStorage) {
  authConfig.storage = window.localStorage;
  authConfig.storageKey = 'mediconnect_supabase_auth_token';
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: authConfig
});

export default supabase;
