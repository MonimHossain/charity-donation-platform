"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userLogin } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";
import { setDemoSession } from "@/lib/mock-auth";
import { DEMO_DONOR } from "@/lib/mock/users";
import SsoButtons from "@/components/auth/SsoButtons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
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
        router.push("/account");
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
      router.push("/account");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid email or password. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-plum shadow-glow mb-4">
            <Heart className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-primary">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to manage your donations and track your impact.
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
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
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
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full rounded-full h-12"
            >
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
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            or continue with
            <span className="flex-1 h-px bg-border" />
          </div>

          <div className="mt-4">
            <SsoButtons />
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            or
            <span className="flex-1 h-px bg-border" />
          </div>

          <div className="mt-4 space-y-3">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-full h-12"
            >
              <Link href="/auth/register">Create an Account</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="w-full rounded-full h-12"
            >
              <Link href="/donate">
                <Heart className="w-4 h-4" /> Continue as Guest
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
