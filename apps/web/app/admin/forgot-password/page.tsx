"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminForgotPassword } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

type RequestStatus = "idle" | "sending" | "sent" | "error";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setError(null);

    try {
      await adminForgotPassword(email);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to send reset email");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Reset Admin Password</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Enter the admin email. If it matches our records, we will send a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Check your inbox for the reset link. It expires shortly.</p>
              <Link href="/admin/login" className="text-xs font-semibold text-primary">
                Return to admin login
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.org"
                  className="h-9 text-sm"
                  required
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={status === "sending"}>
                {status === "sending" ? "Sending link..." : "Send reset link"}
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
