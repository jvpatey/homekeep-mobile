import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createClient,
  Session,
  User,
  SupabaseClient,
} from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import * as AppleAuthentication from "expo-apple-authentication";

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
  signInWithApple: () => Promise<{ data: any; error: any }>;
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


  // signInWithApple function for Apple Sign-In
  const signInWithApple = async () => {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      // Check if Apple Sign-In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return {
          data: null,
          error: { message: "Apple Sign-In is not available on this device" },
        };
      }

      // Request Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return {
          data: null,
          error: { message: "No identity token received from Apple" },
        };
      }

      // Sign in with Supabase using the Apple credential
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      return { data, error };
    } catch (error: any) {
      console.error("Apple sign-in error:", error);

      // Handle user cancellation
      if (error.code === "ERR_REQUEST_CANCELED") {
        return { data: null, error: null }; // User canceled, not an error
      }

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
    signInWithApple,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
