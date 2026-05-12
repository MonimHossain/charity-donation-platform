"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminResetPassword } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const MIN_PASSWORD_LENGTH = 8;

type ResetStatus = "idle" | "saving" | "success" | "error";

function AdminResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const tokenMissing = token.length === 0;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<ResetStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "saving") return;

    if (!token) {
      setError("Reset link is missing or invalid.");
      setStatus("error");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      setStatus("error");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    setError(null);

    try {
      await adminResetPassword(token, password);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Reset failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Set a new admin password</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Choose a new password for your admin account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Your password has been updated. You can sign in now.</p>
              <Link href="/admin/login" className="text-xs font-semibold text-primary">
                Return to admin login
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {tokenMissing && (
                <div className="rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground">
                  This reset link is missing or invalid. Request a new link to continue.
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter a new password"
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter the new password"
                  className="h-9 text-sm"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum {MIN_PASSWORD_LENGTH} characters.
              </p>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={status === "saving" || tokenMissing}>
                {status === "saving" ? "Updating password..." : "Update password"}
              </Button>
              <Link href="/admin/login" className="block text-xs font-semibold text-primary">
                Return to admin login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminResetPasswordPageContent />
    </Suspense>
  );
}
