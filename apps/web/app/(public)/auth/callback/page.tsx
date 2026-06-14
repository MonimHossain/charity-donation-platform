"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function decodeProfile(raw: string) {
  try {
    if (typeof window !== "undefined" && typeof atob === "function") {
      const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      return JSON.parse(atob(padded));
    }
  } catch {
    /* ignore */
  }
  return null;
}

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const authError = params.get("error");
    if (authError) {
      setError(decodeURIComponent(authError));
      return;
    }

    const token = params.get("token");
    const profileRaw = params.get("profile");
    if (!token) {
      setError("Sign-in could not be completed. Please try again.");
      return;
    }

    localStorage.setItem("user_token", token);
    if (profileRaw) {
      const profile = decodeProfile(profileRaw);
      if (profile) localStorage.setItem("user_profile", JSON.stringify(profile));
    }

    router.replace("/account");
  }, [params, router]);

  if (error) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-soft text-center space-y-4">
          <h1 className="font-serif text-2xl text-primary">Sign-in failed</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button asChild className="rounded-full">
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </section>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[70vh] flex items-center justify-center px-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-plum shadow-glow mb-2">
              <Heart className="w-7 h-7 text-primary-foreground" />
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </div>
        </section>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
