"use server"

import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from '@/utils/supabase/server'
import type { AuthSession } from "./types"

export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createClient(); // Create client here for each request

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Get profile information from the profiles table (not user_metadata)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    // Fallback to user_metadata if profile doesn't exist
    const full_name = user.user_metadata?.full_name || null;
    const role = user.user_metadata?.role || 'member';
    
    const { data: { session: supabaseSessionData }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !supabaseSessionData) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        full_name: full_name,
        role: role,
        created_at: user.created_at,
        updated_at: user.updated_at ?? null
      },
      token: supabaseSessionData.access_token
    };
  }

  const { data: { session: supabaseSessionData }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !supabaseSessionData) {
    return null;
  }

  const newSession = {
    user: {
      id: user.id,
      email: user.email ?? null,
      full_name: profile.full_name || user.user_metadata?.full_name || null,
      role: profile.role || 'member', // Use role from profiles table
      created_at: user.created_at,
      updated_at: user.updated_at ?? null
    },
    token: supabaseSessionData.access_token
  };
  
  return newSession;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

export async function requireRole(allowedRoles: string[]): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized")
  }

  return session
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Supabase signInWithPassword error:", error); // Log the specific error
    return { success: false, error: error.message }
  }

  // If login is successful, redirect to a protected page to ensure session is set
  redirect('/dashboard'); 
  return { success: true }
}

export async function register(
  email: string,
  password: string,
  fullName: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'member',
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/forgot-password`,
  })

  if (error) {
    console.error("Error in requestPasswordReset:", error)
    return { success: false, error: "An error occurred while processing your request." }
  }

  return { success: true }
}

export async function resetPassword(password: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error("Error in resetPassword:", error)
    return { success: false, error: "An error occurred" }
  }

  return { success: true }
}
