export function getUserToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_token");
}

export function storeUserSession(token: string, user?: Record<string, unknown>) {
  localStorage.setItem("user_token", token);
  if (user) {
    localStorage.setItem(
      "user_profile",
      JSON.stringify({ ...user, name: user.fullName || user.name })
    );
  }
}

export function clearUserSession() {
  localStorage.removeItem("user_token");
  localStorage.removeItem("user_profile");
}

export function isUserAuthenticated(): boolean {
  return Boolean(getUserToken());
}
