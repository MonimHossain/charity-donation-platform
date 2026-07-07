"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword, getApiErrorMessage } from "@/lib/api";
import { buildAuthHref, sanitizeReturnTo } from "@/lib/auth-redirect";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send reset email. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-plum shadow-glow mb-4">
            <Heart className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-primary">Forgot password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft">
          {sent ? (
            <div className="space-y-4 text-center text-sm text-muted-foreground">
              <p>If an account with that email exists, a reset link has been sent.</p>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={buildAuthHref("/auth/login", returnTo)}>Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="forgot-email">Email address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl"
                  placeholder="you@email.com"
                />
              </div>
              <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full h-12">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href={buildAuthHref("/auth/login", returnTo)} className="text-primary hover:underline font-semibold">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[80vh] flex items-center justify-center py-12 px-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </section>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
