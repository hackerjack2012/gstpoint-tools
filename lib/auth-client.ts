// Session and auth helpers for client components
"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Hook to get current session
export function useCurrentSession() {
  const { data: session, status } = useSession();
  return { session, status };
}

// Hook to check if user is authenticated
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  // Redirect to login if not authenticated
  const requireAuth = (redirectTo: string = "/auth/login") => {
    if (!isAuthenticated && !isLoading) {
      router.push(redirectTo);
      return false;
    }
    return isAuthenticated;
  };

  return { session, isAuthenticated, isLoading, requireAuth };
}

// Logout function with toast notification
export async function handleLogout() {
  try {
    await signOut({ callbackUrl: "/" });
    toast.success("Logged out successfully");
  } catch (error) {
    toast.error("Failed to logout");
  }
}

// Login function
export async function handleLogin(email: string, password: string, callbackUrl: string = "/dashboard") {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      toast.error(result.error);
      return { success: false, error: result.error };
    }

    if (result?.url) {
      toast.success("Logged in successfully");
      return { success: true, url: result.url };
    }

    return { success: false, error: "Login failed" };
  } catch (error) {
    toast.error("Login failed");
    return { success: false, error: "Login failed" };
  }
}

// Signup function
export async function handleSignup(email: string, password: string, name: string) {
  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!data.success) {
      toast.error(data.error || "Signup failed");
      return { success: false, error: data.error };
    }

    toast.success("Account created successfully! Please login.");
    return { success: true, user: data.user };
  } catch (error) {
    toast.error("Signup failed");
    return { success: false, error: "Signup failed" };
  }
}
