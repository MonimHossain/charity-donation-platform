import { Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  findOrCreateDonorUser,
  issueUserSession,
  normalizeEmail,
} from "./userAuth.service.js";

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001").replace(
    /\/$/,
    ""
  );
}

function apiBaseUrl(): string {
  const fromEnv = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://localhost:4000/api/v1";
}

function redirectWithError(res: Response, message: string) {
  const url = new URL(`${appBaseUrl()}/auth/callback`);
  url.searchParams.set("error", message);
  return res.redirect(url.toString());
}

function redirectWithSession(res: Response, token: string, user: Record<string, unknown>) {
  const url = new URL(`${appBaseUrl()}/auth/callback`);
  url.searchParams.set("token", token);
  url.searchParams.set("profile", Buffer.from(JSON.stringify(user)).toString("base64url"));
  return res.redirect(url.toString());
}

export function getAuthProviders(_req: Request, res: Response) {
  return res.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: Boolean(
      process.env.APPLE_CLIENT_ID &&
        process.env.APPLE_TEAM_ID &&
        process.env.APPLE_KEY_ID &&
        process.env.APPLE_PRIVATE_KEY
    ),
    email: true,
  });
}

function googleRedirectUri(): string {
  return `${apiBaseUrl()}/auth/google/callback`;
}

export function startGoogleAuth(_req: Request, res: Response) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ message: "Google sign-in is not configured on this server" });
  }

  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export async function googleAuthCallback(req: Request, res: Response) {
  try {
    const { code, state, error } = req.query;
    if (error) return redirectWithError(res, String(error));
    if (!code || typeof code !== "string") {
      return redirectWithError(res, "Missing authorization code");
    }

    const expectedState = req.cookies?.oauth_state;
    if (!expectedState || !state || expectedState !== state) {
      return redirectWithError(res, "Invalid OAuth state");
    }
    res.clearCookie("oauth_state");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: googleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!tokenRes.ok || !tokenJson.access_token) {
      return redirectWithError(
        res,
        tokenJson.error_description || tokenJson.error || "Google token exchange failed"
      );
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const profile = (await profileRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
    };

    if (!profile.email || !profile.sub) {
      return redirectWithError(res, "Google account did not return an email address");
    }

    const user = await findOrCreateDonorUser({
      email: normalizeEmail(profile.email),
      fullName: profile.name || profile.email.split("@")[0] || "Donor",
      authProvider: "google",
      providerSubject: profile.sub,
      avatarUrl: profile.picture,
      emailVerified: profile.email_verified ?? true,
      passwordHash: null,
    });

    const session = issueUserSession(res, user);
    return redirectWithSession(res, session.token, session.user);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return redirectWithError(res, "Google sign-in failed");
  }
}

function appleRedirectUri(): string {
  return `${apiBaseUrl()}/auth/apple/callback`;
}

function appleClientSecret(): string {
  const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  return jwt.sign({}, privateKey, {
    algorithm: "ES256",
    keyid: process.env.APPLE_KEY_ID,
    issuer: process.env.APPLE_TEAM_ID,
    audience: "https://appleid.apple.com",
    subject: process.env.APPLE_CLIENT_ID,
    expiresIn: "180d",
  });
}

export function startAppleAuth(_req: Request, res: Response) {
  if (
    !process.env.APPLE_CLIENT_ID ||
    !process.env.APPLE_TEAM_ID ||
    !process.env.APPLE_KEY_ID ||
    !process.env.APPLE_PRIVATE_KEY
  ) {
    return res.status(503).json({ message: "Apple sign-in is not configured on this server" });
  }

  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID,
    redirect_uri: appleRedirectUri(),
    response_type: "code",
    scope: "name email",
    response_mode: "form_post",
    state,
  });

  return res.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
}

export async function appleAuthCallback(req: Request, res: Response) {
  try {
    const { code, state, error, user: appleUserRaw } = req.body as {
      code?: string;
      state?: string;
      error?: string;
      user?: string;
    };

    if (error) return redirectWithError(res, String(error));
    if (!code) return redirectWithError(res, "Missing Apple authorization code");

    const expectedState = req.cookies?.oauth_state;
    if (!expectedState || !state || expectedState !== state) {
      return redirectWithError(res, "Invalid OAuth state");
    }
    res.clearCookie("oauth_state");

    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.APPLE_CLIENT_ID!,
        client_secret: appleClientSecret(),
        code,
        grant_type: "authorization_code",
        redirect_uri: appleRedirectUri(),
      }),
    });

    const tokenJson = (await tokenRes.json()) as {
      id_token?: string;
      error?: string;
    };
    if (!tokenRes.ok || !tokenJson.id_token) {
      return redirectWithError(res, tokenJson.error || "Apple token exchange failed");
    }

    const [, payloadPart] = tokenJson.id_token.split(".");
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as {
      sub?: string;
      email?: string;
      email_verified?: string | boolean;
    };

    let fullName = "Apple Donor";
    if (appleUserRaw) {
      try {
        const parsed = JSON.parse(appleUserRaw) as { name?: { firstName?: string; lastName?: string } };
        const parts = [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean);
        if (parts.length) fullName = parts.join(" ");
      } catch {
        /* ignore */
      }
    }

    if (!payload.sub) {
      return redirectWithError(res, "Apple account did not return a valid identity");
    }

    const email = payload.email
      ? normalizeEmail(payload.email)
      : `${payload.sub}@privaterelay.appleid.com`;

    const user = await findOrCreateDonorUser({
      email,
      fullName,
      authProvider: "apple",
      providerSubject: payload.sub,
      emailVerified: payload.email_verified === true || payload.email_verified === "true",
      passwordHash: null,
    });

    const session = issueUserSession(res, user);
    return redirectWithSession(res, session.token, session.user);
  } catch (err) {
    console.error("Apple OAuth callback error:", err);
    return redirectWithError(res, "Apple sign-in failed");
  }
}
