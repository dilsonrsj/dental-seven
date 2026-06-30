/** MVP demo: dados fictícios locais (sem Supabase). Defina DEMO_MOCK_DATA=false para usar Supabase. */
export function isDemoMockDataEnabled(): boolean {
  return process.env.DEMO_MOCK_DATA !== "false";
}

export async function isDataSourceReady(): Promise<boolean> {
  return isDemoMockDataEnabled() || isSupabaseConfigured();
}

async function isSupabaseConfigured(): Promise<boolean> {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
