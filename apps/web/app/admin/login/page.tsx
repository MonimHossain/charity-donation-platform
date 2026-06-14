"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, LogIn, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";
import {
  DEMO_ADMIN_TOKEN,
  DEFAULT_DEMO_ADMIN_PROFILE,
  isValidAdminToken,
  purgeStaleAdminTokens,
} from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    purgeStaleAdminTokens();
    const token = localStorage.getItem("admin_token");
    if (isValidAdminToken(token) && !USE_MOCK_DATA) {
      router.replace("/admin");
      return;
    }
    if (!isValidAdminToken(token)) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_profile");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      if (USE_MOCK_DATA) {
        localStorage.setItem("admin_token", DEMO_ADMIN_TOKEN);
        localStorage.setItem(
          "admin_profile",
          JSON.stringify({
            ...DEFAULT_DEMO_ADMIN_PROFILE,
            email: email || DEFAULT_DEMO_ADMIN_PROFILE.email,
          })
        );
        toast.success("Demo admin session");
        router.push("/admin");
        return;
      }
      const data = await adminLogin(email, password);
      const token = typeof data?.token === "string" ? data.token.trim() : "";
      if (!token) {
        toast.error("Login succeeded but no token was returned. Check the API.");
        return;
      }
      localStorage.setItem("admin_token", token);
      localStorage.setItem(
        "admin_profile",
        JSON.stringify(data.user ?? { email, fullName: "Admin" })
      );
      sessionStorage.setItem("admin_just_logged_in", "1");
      toast.success("Welcome back! Redirecting to dashboard...");
      router.replace("/admin");
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        (status === 503
          ? "API database is offline. Start PostgreSQL, restart the API, or use mock mode."
          : "Invalid email or password");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Heart className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">
            Admin Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in to manage your charity platform
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
