import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the Service Role Key
// This client bypasses Row Level Security (RLS) policies.
// IT MUST ONLY BE USED ON THE SERVER (API routes or Server Components).
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
