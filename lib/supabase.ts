import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that need elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types
export interface Memory {
  id: string
  content: string
  category: 'allergy' | 'like' | 'dislike' | 'attribute'
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  title: string
  messages: any[]
  created_at: string
  updated_at: string
}

export interface SupabaseChatSession {
  id: string
  title: string
  messages: any[]
  created_at: string
  updated_at: string
} 