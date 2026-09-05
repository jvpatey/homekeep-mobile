import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Session, User, SupabaseClient } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import { Alert, AppState } from "react-native";
import { MaintenanceService } from "../services/maintenanceService";
import { supabase, hasValidCredentials } from "../lib/supabase";
import { ensureAuthSession } from "../utils/ensureAuthSession";
import {
  isInvalidSessionError,
  SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_TITLE,
} from "../utils/authSessionErrors";
import { logOutPurchases } from "../lib/purchases";

export { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionReady: boolean;
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
  deleteAccount: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  updateUserFullName: (
    fullName: string
  ) => Promise<{ success: boolean; error?: string }>;
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
  const [sessionReady, setSessionReady] = useState(false);

  const voluntarySignOutRef = useRef(false);
  const sessionRecoveryRef = useRef({ inProgress: false, alertShown: false });
  const hadAuthenticatedSessionRef = useRef(false);

  const clearLocalAuthState = useCallback(async () => {
    setSession(null);
    setUser(null);
    setSessionReady(true);
    await logOutPurchases();
    if (!supabase) return;
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Local clear is best-effort when tokens are already invalid
    }
  }, []);

  const showSessionExpiredAlert = useCallback(() => {
    if (sessionRecoveryRef.current.alertShown) return;
    sessionRecoveryRef.current.alertShown = true;
    Alert.alert(SESSION_EXPIRED_TITLE, SESSION_EXPIRED_MESSAGE, [
      { text: "OK" },
    ]);
  }, []);

  const handleSessionExpired = useCallback(
    async (error?: unknown) => {
      if (!supabase || sessionRecoveryRef.current.inProgress) return;

      if (error && !isInvalidSessionError(error)) return;

      sessionRecoveryRef.current.inProgress = true;
      hadAuthenticatedSessionRef.current = false;

      try {
        await clearLocalAuthState();
        showSessionExpiredAlert();
        if (__DEV__ && error) {
          console.warn("Session expired:", error);
        }
      } finally {
        sessionRecoveryRef.current.inProgress = false;
        setLoading(false);
        setSessionReady(true);
      }
    },
    [clearLocalAuthState, showSessionExpiredAlert]
  );

  const upsertUserTimezone = async (currentUser: User | null) => {
    try {
      if (!supabase || !currentUser) return;
      const deviceTimezone =
        (Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC";

      await supabase.from("user_settings").upsert(
        [
          {
            user_id: currentUser.id,
            timezone: deviceTimezone,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id" }
      );
    } catch (err) {
      // Non-fatal; timezone sync failure should not impact auth flow
      console.warn("Timezone upsert failed", err);
    }
  };

  const applyAuthenticatedSession = useCallback(
    async (nextSession: Session) => {
      const sessionValid = await ensureAuthSession();
      if (!sessionValid) {
        await handleSessionExpired();
        return;
      }

      setSession(nextSession);
      setUser(nextSession.user);
      hadAuthenticatedSessionRef.current = true;
      sessionRecoveryRef.current.alertShown = false;
      setSessionReady(true);
      setLoading(false);
      await upsertUserTimezone(nextSession.user);
    },
    [handleSessionExpired]
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setSessionReady(true);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (__DEV__) {
        console.log(
          "Auth state changed:",
          event,
          nextSession?.user?.id || "no user"
        );
      }

      if (event === "INITIAL_SESSION") {
        if (nextSession?.user) {
          await applyAuthenticatedSession(nextSession);
        } else {
          setSession(null);
          setUser(null);
          setSessionReady(true);
          setLoading(false);
        }
        return;
      }

      if (nextSession?.user) {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          sessionRecoveryRef.current.alertShown = false;
        }
        await applyAuthenticatedSession(nextSession);
        return;
      }

      if (event === "SIGNED_OUT") {
        const signedOutUnexpectedly =
          hadAuthenticatedSessionRef.current &&
          !voluntarySignOutRef.current;

        setSession(null);
        setUser(null);
        setSessionReady(true);
        setLoading(false);

        if (signedOutUnexpectedly) {
          hadAuthenticatedSessionRef.current = false;
          showSessionExpiredAlert();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [applyAuthenticatedSession, showSessionExpiredAlert]);

  // Handle app state changes for optimal session management
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        client.auth.startAutoRefresh();
        void client.auth.getSession().then(({ data: { session } }) => {
          if (
            session &&
            (session.expires_at ?? 0) * 1000 < Date.now() + 60_000
          ) {
            void client.auth.refreshSession();
          }
          if (session?.user) {
            void upsertUserTimezone(session.user);
          }
        });
      } else {
        client.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    client.auth.startAutoRefresh();

    return () => {
      subscription?.remove();
      client.auth.stopAutoRefresh();
    };
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
    if (!supabase) {
      console.warn("Cannot sign out: Supabase not configured");
      return;
    }
    voluntarySignOutRef.current = true;
    hadAuthenticatedSessionRef.current = false;
    try {
      console.log("Starting sign out process, current user:", user?.id);
      // Best-effort: clear push token so logged-out device stops receiving pushes.
      // Do not block auth.signOut on this: the first request after cold start can
      // hang on flaky networks, which made sign-out appear to do nothing.
      if (user?.id) {
        const clearPush = supabase
          .from("profiles")
          .update({ push_token: null, updated_at: new Date().toISOString() })
          .eq("id", user.id)
          .then(
            ({ error }) => {
              if (error) {
                console.warn("Failed to clear push token on sign-out", error);
              } else {
                console.log("Push token cleared successfully");
              }
            },
            (err: unknown) => {
              console.warn("Failed to clear push token on sign-out", err);
            }
          );
        const maxWaitMs = 3000;
        await Promise.race([
          clearPush,
          new Promise<void>((resolve) => setTimeout(resolve, maxWaitMs)),
        ]);
      }

      await logOutPurchases();

      // Sign out from Supabase auth
      const { error } = await supabase.auth.signOut();
      if (error) {
        // If session is already missing, manually clear state to update UI
        if (isInvalidSessionError(error)) {
          await clearLocalAuthState();
          return;
        }
        console.error("Supabase sign out error:", error);
        throw error;
      }
      console.log("Sign out successful");
    } catch (err) {
      if (isInvalidSessionError(err)) {
        await clearLocalAuthState();
        return;
      }
      console.error("Error during sign out:", err);
      throw err;
    } finally {
      voluntarySignOutRef.current = false;
    }
  };

  // deleteAccount function for complete account deletion
  const deleteAccount = async () => {
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }

    try {
      console.log("Starting account deletion");
      const result = await MaintenanceService.deleteUserAccount();
      if (result.success) {
        console.log("Account deleted successfully, signing out");
        await logOutPurchases();
        // Sign out the user after successful deletion
        const { error } = await supabase.auth.signOut();
        if (error) {
          if (!isInvalidSessionError(error)) {
            console.error("Error signing out after account deletion:", error);
          }
          await clearLocalAuthState();
        } else {
          console.log("Sign out successful after account deletion");
        }
        return { success: true };
      } else {
        console.error("Account deletion failed:", result.error);
        return {
          success: false,
          error: result.error?.message || "Failed to delete account",
        };
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  const updateUserFullName = useCallback(
    async (
      fullName: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        return { success: false, error: "Not signed in" };
      }
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) setUser(data.user);
      return { success: true };
    },
    []
  );

  const value = {
    user,
    session,
    loading,
    sessionReady,
    isConfigured: hasValidCredentials,
    supabase,
    signIn,
    signUp,
    signInWithApple,
    signOut,
    deleteAccount,
    updateUserFullName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
