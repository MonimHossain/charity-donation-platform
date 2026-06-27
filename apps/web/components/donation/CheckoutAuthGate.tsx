"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SsoButtons from "@/components/auth/SsoButtons";
import {
  checkDonorEmail,
  getApiErrorMessage,
  requestDonorAccess,
  userLogin,
  type DonorEmailStatus,
} from "@/lib/api";
import { buildAuthHref } from "@/lib/auth-redirect";
import { storeUserSession } from "@/lib/user-session";
import { USE_MOCK_DATA } from "@/lib/config";
import { DEMO_DONOR } from "@/lib/mock/users";

const CHECKOUT_RETURN = "/donation/checkout";

type Props = {
  onAuthenticated: () => void;
};

type Step = "email" | "login" | "setup" | "sent";

export default function CheckoutAuthGate({ onAuthenticated }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<DonorEmailStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const completeAuth = useCallback(
    (token: string, user?: Record<string, unknown>) => {
      storeUserSession(token, user);
      onAuthenticated();
    },
    [onAuthenticated]
  );

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setStatus("password");
        setStep("login");
        return;
      }
      const result = await checkDonorEmail(email);
      setStatus(result.status);
      if (result.status === "new" || result.status === "needs_password_setup") {
        setStep("setup");
      } else {
        setStep("login");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not verify email. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setStep("sent");
        return;
      }
      await requestDonorAccess(email, fullName || undefined);
      setStep("sent");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send activation email. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        completeAuth("demo-token", DEMO_DONOR);
        return;
      }
      const res = await userLogin(email, password);
      if (res.token) {
        completeAuth(res.token, res.user);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid email or password. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft max-w-xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl md:text-3xl text-primary">Sign in to continue</h1>
        <p className="text-sm text-muted-foreground">
          Your cart is saved. Sign in or create an account to complete your donation.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === "email" && (
        <form onSubmit={handleEmailContinue} className="space-y-4">
          <div>
            <Label htmlFor="checkout-auth-email">Email address</Label>
            <Input
              id="checkout-auth-email"
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
          </Button>
        </form>
      )}

      {step === "setup" && (
        <form onSubmit={handleRequestAccess} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We&apos;ll email you a link to set your password and continue to checkout.
          </p>
          <div>
            <Label htmlFor="checkout-auth-name">Full name (optional)</Label>
            <Input
              id="checkout-auth-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <Label htmlFor="checkout-auth-email-setup">Email</Label>
            <Input
              id="checkout-auth-email-setup"
              type="email"
              readOnly
              value={email}
              className="mt-1.5 h-12 rounded-xl bg-muted"
            />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full h-12 gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
            Email me a link
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-full"
            onClick={() => setStep("email")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Use a different email
          </Button>
        </form>
      )}

      {step === "sent" && (
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
            <Mail className="w-7 h-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            Check your inbox at <strong className="text-foreground">{email}</strong> for a link to set
            your password. After that, you&apos;ll return here to complete your donation.
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={loading}
            onClick={handleRequestAccess}
          >
            Resend email
          </Button>
        </div>
      )}

      {step === "login" && (
        <div className="space-y-4">
          {status === "google" ? (
            <p className="text-sm text-muted-foreground">
              This email is linked to Google. Continue with Google to proceed.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Welcome back. Sign in with your password to continue.
            </p>
          )}

          {status !== "google" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="checkout-login-email">Email</Label>
                <Input
                  id="checkout-login-email"
                  type="email"
                  readOnly
                  value={email}
                  className="mt-1.5 h-12 rounded-xl bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="checkout-login-password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="checkout-login-password"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link
                  href={buildAuthHref("/auth/forgot-password", CHECKOUT_RETURN)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full h-12 gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Sign in
              </Button>
            </form>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            or
            <span className="flex-1 h-px bg-border" />
          </div>

          <SsoButtons returnTo={CHECKOUT_RETURN} />

          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-full"
            onClick={() => {
              setStep("email");
              setStatus(null);
              setPassword("");
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Use a different email
          </Button>
        </div>
      )}
    </div>
  );
}
