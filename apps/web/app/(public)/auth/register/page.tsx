"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Heart, Eye, EyeOff, UserPlus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userRegister } from "@/lib/api";
import SsoButtons from "@/components/auth/SsoButtons";
import { buildAuthHref, sanitizeReturnTo } from "@/lib/auth-redirect";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordsMatch = password === confirmPassword;
  const passwordStrong = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    if (!passwordStrong) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!termsAgreed) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    setLoading(true);
    try {
      const res = await userRegister({
        fullName: name,
        email,
        password,
        phone: phone || undefined,
        marketingConsent,
        smsConsent,
      });
      if (res.token) {
        localStorage.setItem("user_token", res.token);
        if (res.user) {
          localStorage.setItem(
            "user_profile",
            JSON.stringify({ ...res.user, name: res.user.fullName || res.user.name })
          );
        }
      }
      router.push(returnTo || "/account");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-plum shadow-glow mb-4">
            <Heart className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-primary">
            Create Your Account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your donations, manage recurring gifts, and see your impact.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name *
              </Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <Label htmlFor="reg-email" className="text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <Label htmlFor="reg-password" className="text-sm font-medium">
                Password *
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="reg-password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
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
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password *
              </Label>
              <Input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="Re-enter your password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reg-phone" className="text-sm font-medium">
                Phone (optional)
              </Label>
              <Input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="+44 7700 900000"
              />
            </div>

            {/* Consent checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  I&apos;d like to receive email updates about campaigns, events, and
                  impact stories.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  I&apos;d like to receive SMS notifications about urgent appeals.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary"
                  required
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-primary hover:underline font-medium"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline font-medium"
                  >
                    Privacy Policy
                  </Link>
                  . *
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading || !termsAgreed}
              size="lg"
              className="w-full rounded-full h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Creating account&hellip;
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            or continue with
            <span className="flex-1 h-px bg-border" />
          </div>

          <div className="mt-4">
            <SsoButtons returnTo={returnTo || undefined} />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={buildAuthHref("/auth/login", returnTo)}
              className="text-primary hover:underline font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[80vh] flex items-center justify-center py-12 px-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </section>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
