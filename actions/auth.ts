'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export interface AuthResponse {
  error?: string
  success?: boolean
}

/**
 * Server Action: Authenticate an existing user via Supabase Auth.
 */
export async function login(formData: FormData): Promise<AuthResponse | void> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('apikey')) {
      return {
        error: 'Invalid Supabase API key in .env.local. Please copy your valid anon key (starts with eyJ...) from your Supabase Dashboard -> Settings -> API.',
      }
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return {
        error: 'Email not confirmed. Please check your inbox, or in Supabase Dashboard go to Authentication -> Providers -> Email and turn off "Confirm email".',
      }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Server Action: Register a new user via Supabase Auth.
 * Passing `full_name` in user metadata triggers public.profiles insertion with user details.
 */
export async function signup(formData: FormData): Promise<AuthResponse | void> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string) || ''

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('apikey')) {
      return {
        error: 'Invalid Supabase API key in .env.local. Please copy your valid anon key (starts with eyJ...) from your Supabase Dashboard -> Settings -> API.',
      }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Server Action: Sign out the user and clear session cookies.
 */
export async function logout(): Promise<AuthResponse | void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
