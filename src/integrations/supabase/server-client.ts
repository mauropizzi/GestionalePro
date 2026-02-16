import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = "https://mlkahaedxpwkhheqwsjc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2FoYWVkeHB3a2hoZXF3c2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzgyNTksImV4cCI6MjA3Njg1NDI1OX0._QR-tTUw-NPhjCv9boDDQAsewgyDzMhwiXNIlxIBCjQ";

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}

export async function createServiceClient() {
  const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1hdXRoZW50aWNhdG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTc3Njg1NDI1OX0.SvqK0j0G0x2hNjQ3xZ9Y8wK1mJ3lL5pN9vX2mQ3nJk"

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get(name: string) {
          return null
        },
      },
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}