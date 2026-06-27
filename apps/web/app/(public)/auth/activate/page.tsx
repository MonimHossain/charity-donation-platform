"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activateAccount, getApiErrorMessage } from "@/lib/api";
import { sanitizeReturnTo } from "@/lib/auth-redirect";
import { storeUserSession } from "@/lib/user-session";

function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo")) || "/donation/checkout";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordsMatch = password === confirmPassword;
  const passwordStrong = password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Activation link is missing or invalid.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    if (!passwordStrong) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await activateAccount(token, password);
      if (res.token) {
        storeUserSession(res.token, res.user);
      }
      router.replace(returnTo);
    } catch (err) {
      setError(getApiErrorMessage(err, "Activation failed. Please request a new link."));
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
          <h1 className="font-serif text-2xl md:text-3xl text-primary">Set your password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a password to continue with your donation.
          </p>
        </div>

        <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft">
          {!token ? (
            <div className="space-y-4 text-center text-sm text-muted-foreground">
              <p>This activation link is invalid or has expired.</p>
              <Button asChild className="rounded-full">
                <Link href="/donation/checkout">Back to checkout</Link>
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
                <Label htmlFor="activate-password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="activate-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl pr-12"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <p
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      passwordStrong ? "text-green-600" : "text-destructive"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    {passwordStrong ? "Strong password" : "Needs at least 8 characters"}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="activate-confirm-password">Confirm password</Label>
                <Input
                  id="activate-confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl"
                  placeholder="Re-enter your password"
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match.</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !passwordsMatch || !passwordStrong}
                size="lg"
                className="w-full rounded-full h-12"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue to checkout"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[80vh] flex items-center justify-center py-12 px-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </section>
      }
    >
      <ActivateAccountContent />
    </Suspense>
  );
}
