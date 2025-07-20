import { createClient } from "@supabase/supabase-js"

// Fallback values for Supabase URL and Anon Key when environment variables are not set.
// These are used in the V0 preview environment to prevent errors, but will not
// provide actual database connectivity.
const FALLBACK_SUPABASE_URL = "https://fallback.supabase.co"
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGxiYWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzgwNjQ0MDAsImV4cCI6MTk5MzY0MDQwMH0.fallback_key_for_v0_preview"

// Create a single Supabase client for the server-side.
// This client is used in Server Actions and Route Handlers.
export function createServerClient() {
  const serverSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const serverSupabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (serverSupabaseUrl === FALLBACK_SUPABASE_URL || !serverSupabaseAnonKey) {
    console.warn(
      "Supabase environment variables are missing. Using fallback values. " +
        "Make sure BOTH `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` " +
        "are defined in your Vercel project settings or `.env.local` file for full functionality.",
    )
    // Return a stub client that mimics the Supabase client but performs no-op operations
    // and returns empty arrays for select calls to prevent runtime errors in the preview.
    return {
      from: (tableName: string) => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            then: (callback: any) => Promise.resolve(callback({ data: [], error: null })),
          }),
          then: (callback: any) => Promise.resolve(callback({ data: [], error: null })),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      rpc: () => Promise.resolve({ data: null, error: null }),
      channel: () => ({
        on: () => ({
          subscribe: () => Promise.resolve({ error: null }),
        }),
        unsubscribe: () => Promise.resolve({ error: null }),
      }),
    } as ReturnType<typeof createClient> // Cast to the expected type
  }

  return createClient(serverSupabaseUrl, serverSupabaseAnonKey)
}

// Create a client-side Supabase client for real-time subscriptions
export function createClientSideClient() {
  const clientSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const clientSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (clientSupabaseUrl === FALLBACK_SUPABASE_URL || !clientSupabaseAnonKey) {
    console.warn("Using fallback Supabase client for client-side operations")
    return {
      from: (tableName: string) => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            then: (callback: any) => Promise.resolve(callback({ data: [], error: null })),
          }),
          then: (callback: any) => Promise.resolve(callback({ data: [], error: null })),
        }),
      }),
      channel: () => ({
        on: () => ({
          subscribe: () => Promise.resolve({ error: null }),
        }),
        unsubscribe: () => Promise.resolve({ error: null }),
      }),
    } as ReturnType<typeof createClient>
  }

  return createClient(clientSupabaseUrl, clientSupabaseAnonKey)
}

// Singleton pattern for client-side Supabase client
let clientSideSupabase: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!clientSideSupabase) {
    clientSideSupabase = createClientSideClient()
  }
  return clientSideSupabase
}

// Re-export for backwards compatibility with older imports.
export { createClient }

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY,
)
