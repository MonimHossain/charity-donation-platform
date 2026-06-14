"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type AuthProviders = {
  google?: boolean;
  apple?: boolean;
  email?: boolean;
};

function providerStartUrl(provider: "google" | "apple"): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  return `${apiBase.replace(/\/$/, "")}/auth/${provider}`;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.46 2.2-1.23 2.98-.83.84-2.18 1.4-3.28 1.32-.14-1.09.42-2.25 1.16-3.01.83-.87 2.28-1.47 3.35-1.29zM20.88 17.07c-.57 1.28-.85 1.86-1.58 2.99-1.03 1.57-2.48 3.53-4.28 3.54-1.6 0-2.02-1.04-4.19-1.03-2.17.01-2.63 1.05-4.23 1.03-1.8-.01-3.18-1.72-4.21-3.29-2.89-4.22-3.2-9.17-1.41-11.8 1.26-1.86 3.25-2.95 5.09-2.95 2.01 0 3.27 1.05 4.93 1.05 1.59 0 2.56-1.05 4.85-1.05 1.73 0 3.56 1.18 4.82 3.22-4.24 2.3-3.55 8.28.91 9.99z" />
    </svg>
  );
}

export default function SsoButtons() {
  const [providers, setProviders] = useState<AuthProviders | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    fetch(`${apiBase}/auth/providers`)
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch(() => setProviders({ google: false, apple: false, email: true }));
  }, []);

  const googleReady = providers?.google === true;
  const appleReady = providers?.apple === true;

  return (
    <div className="space-y-3">
      {!providers ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-full h-12 gap-3"
            onClick={() => {
              window.location.href = providerStartUrl("google");
            }}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-full h-12 gap-3 bg-foreground text-background hover:bg-foreground/90"
            onClick={() => {
              window.location.href = providerStartUrl("apple");
            }}
          >
            <AppleIcon />
            Continue with Apple
          </Button>
          {!googleReady && !appleReady && (
            <p className="text-center text-xs text-muted-foreground px-2">
              Social sign-in requires Google or Apple credentials in the server environment.
              Email sign-in works without them.
            </p>
          )}
        </>
      )}
    </div>
  );
}
