import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createClient,
  Session,
  User,
  SupabaseClient,
} from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// Supabase configuration with environment variables and fallbacks
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Only create client if we have valid credentials
const hasValidCredentials =
  supabaseUrl !== "https://placeholder.supabase.co" &&
  supabaseAnonKey !== "placeholder-key";

export const supabase = hasValidCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  supabase: SupabaseClient | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// useAuth hook for the useAuth on the home screen
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// AuthProvider component for the AuthProvider on the home screen
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session on app startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // signIn function for the signIn on the home screen
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // signUp function for the signUp on the home screen
  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    // Create redirect URL for email verification
    const redirectTo = "homekeep://auth/verify";

    // Create the auth user with email redirect and metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      return { data: null, error: authError };
    }

    // Profile will be automatically created by the database trigger

    return { data: authData, error: null };
  };

  // signInWithGoogle function for the signInWithGoogle on the home screen
  const signInWithGoogle = async () => {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      // Create redirect URI for OAuth callback
      const redirectTo = makeRedirectUri({
        scheme: "homekeep",
        path: "/auth/callback",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      // open auth URL in browser and handle callback
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );

        if (result.type === "success" && result.url) {
          // extract the session from the callback URL
          const url = new URL(result.url);
          const access_token = url.searchParams.get("access_token");
          const refresh_token = url.searchParams.get("refresh_token");

          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
            return { data: sessionData, error: sessionError };
          }
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error("Google sign-in error:", error);
      return { data: null, error: error as Error };
    }
  };

  // signOut function for the signOut on the home screen
  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    isConfigured: hasValidCredentials,
    supabase,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
