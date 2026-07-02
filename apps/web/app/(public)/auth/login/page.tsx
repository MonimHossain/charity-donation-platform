"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Eye, EyeOff, LogIn, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkDonorEmail,
  requestDonorAccess,
  userLogin,
  type DonorEmailStatus,
} from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";
import { setDemoSession } from "@/lib/mock-auth";
import { DEMO_DONOR } from "@/lib/mock/users";
import SsoButtons from "@/components/auth/SsoButtons";
import { buildAuthHref, sanitizeReturnTo } from "@/lib/auth-redirect";

type LoginStep = "email" | "link-sent" | "google" | "password";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const destination = returnTo || "/account";

  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<DonorEmailStatus | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendSignInLink() {
    setError("");
    setLoading(true);
    try {
      const result = await requestDonorAccess(email, undefined, destination);
      if (result.status === "google") {
        setStep("google");
        return;
      }
      setEmailStatus(result.status);
      if (result.status !== "password") {
        setStep("link-sent");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not send sign-in link. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setStep("link-sent");
        return;
      }
      const { status } = await checkDonorEmail(email);
      setEmailStatus(status);
      if (status === "google") {
        setStep("google");
        return;
      }
      // Always email a sign-in link (activation or reset). Password users can still use the password step.
      await sendSignInLink();
      if (status === "password") {
        setStep("password");
        return;
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setDemoSession(
          { id: DEMO_DONOR.id, email: email || DEMO_DONOR.email, name: DEMO_DONOR.name },
          ["donor"]
        );
        localStorage.setItem("user_token", "demo-token");
        localStorage.setItem("user_profile", JSON.stringify(DEMO_DONOR));
        router.push(destination);
        return;
      }
      const res = await userLogin(email, password);
      if (res.token) {
        localStorage.setItem("user_token", res.token);
        if (res.user) {
          localStorage.setItem(
            "user_profile",
            JSON.stringify({ ...res.user, name: res.user.fullName || res.user.name })
          );
        }
      }
      router.push(destination);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid email or password. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function goBackToEmail() {
    setStep("email");
    setError("");
    setPassword("");
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-plum shadow-glow mb-4">
            <Heart className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-primary">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to manage your donations and track your impact.
          </p>
        </div>

        <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft">
          {step === "link-sent" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="font-semibold text-foreground">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
                  Open the link to {emailStatus === "password" ? "reset your password and " : ""}sign in.
                  The link expires in 24 hours.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full h-12"
                  disabled={loading}
                  onClick={sendSignInLink}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Resend link"}
                </Button>
                <button
                  type="button"
                  onClick={goBackToEmail}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}

          {step === "google" && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={goBackToEmail}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{email}</span> is linked to Google.
                Continue with Google to sign in.
              </p>
              <SsoButtons returnTo={returnTo || undefined} />
            </div>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <button
                type="button"
                onClick={goBackToEmail}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                We also sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
                Check your inbox, or enter your password below.
              </div>
                <Input
                  id="email"
                  type="email"
                  readOnly
                  value={email}
                  className="mt-1.5 h-12 rounded-xl bg-muted/50"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href={buildAuthHref("/auth/forgot-password", returnTo)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full h-12">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Signing in&hellip;
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" /> Sign In
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Prefer email?{" "}
                <button
                  type="button"
                  onClick={sendSignInLink}
                  disabled={loading}
                  className="text-primary hover:underline font-semibold"
                >
                  Email me a sign-in link
                </button>
              </p>
            </form>
          )}

          {step === "email" && (
            <>
              <form onSubmit={handleEmailContinue} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="login-email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
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
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Continuing&hellip;
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" /> Continue with email
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

              <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex-1 h-px bg-border" />
                or
                <span className="flex-1 h-px bg-border" />
              </div>

              <div className="mt-4">
                <Button asChild variant="outline" size="lg" className="w-full rounded-full h-12">
                  <Link href={buildAuthHref("/auth/register", returnTo)}>Create an Account</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[80vh] flex items-center justify-center py-12 px-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </section>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
