"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = session?.user?.email === "admin@gstpoint-tools.com" ||
                 session?.user?.email === "hackerjack2012@gmail.com";

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition">
          GSTPoint Tools
        </Link>

        {/* Main Navigation */}
        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <Link href="/pricing" className="hover:text-blue-600 transition">
            Pricing
          </Link>
          <Link href="/#features" className="hover:text-blue-600 transition">
            Features
          </Link>
          <Link href="/#how-it-works" className="hover:text-blue-600 transition">
            How It Works
          </Link>
          {session && (
            <Link href="/dashboard" className="hover:text-blue-600 transition">
              Tools
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="hover:text-blue-600 transition">
              Admin
            </Link>
          )}
          <Link href="/#contact" className="hover:text-blue-600 transition">
            Contact
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
          ) : session ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden md:flex items-center gap-2 rounded-xl border border-purple-300 bg-white px-4 py-2 text-purple-700 font-medium hover:bg-purple-50 transition"
                >
                  <span className="text-sm">Admin Panel</span>
                </Link>
              )}
              <Link
                href="/account"
                className="hidden md:flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                <span className="text-sm">My Account</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-red-600 font-medium hover:bg-red-50 transition disabled:opacity-50"
              >
                {isLoading ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden md:block rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-xl bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
              >
                Get Started Free
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg border border-slate-300 hover:bg-slate-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-slate-200 bg-white">
        <nav className="flex flex-col gap-4 px-6 py-4">
          <Link href="/" className="py-2 text-slate-700 hover:text-blue-600">
            Home
          </Link>
          <Link href="/pricing" className="py-2 text-slate-700 hover:text-blue-600">
            Pricing
          </Link>
          <Link href="/#features" className="py-2 text-slate-700 hover:text-blue-600">
            Features
          </Link>
          {session && (
            <Link href="/dashboard" className="py-2 text-slate-700 hover:text-blue-600">
              Tools
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="py-2 text-slate-700 hover:text-blue-600">
              Admin Panel
            </Link>
          )}
          <Link href="/#contact" className="py-2 text-slate-700 hover:text-blue-600">
            Contact
          </Link>
          {session ? (
            <>
              <Link href="/account" className="py-2 text-slate-700 hover:text-blue-600">
                My Account
              </Link>
              <button
                onClick={handleLogout}
                className="py-2 text-red-600 hover:text-red-700 text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="py-2 text-slate-700 hover:text-blue-600">
                Login
              </Link>
              <Link href="/auth/signup" className="py-2 text-slate-700 hover:text-blue-600">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
