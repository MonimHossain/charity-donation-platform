"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  History,
  Repeat,
  LogOut,
  Heart,
  Menu,
  X,
  Loader2,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchUserProfile, userLogout } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface UserProfile {
  name: string;
  email: string;
}

const NAV_ITEMS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/history", label: "Donation History", icon: History },
  { href: "/account/automated", label: "Automated Donations", icon: Sparkles },
  { href: "/account/recurring", label: "Recurring Donations", icon: Repeat },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    fetchUserProfile()
      .then((res) => {
        const profile = res.user || res.data || res;
        setUser({
          name: profile.fullName || profile.name || "Donor",
          email: profile.email || "",
        });
        localStorage.setItem(
          "user_profile",
          JSON.stringify({
            ...profile,
            name: profile.fullName || profile.name,
          })
        );
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_profile");
        router.replace("/auth/login");
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await userLogout();
    } catch {
      // proceed even if logout API fails
    }
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_profile");
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="container-wide py-8 lg:py-12 max-w-full overflow-x-hidden">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 min-w-0">
        {/* Mobile nav toggle */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <h1 className="font-serif text-xl text-primary">My Account</h1>
          <button
            onClick={() => setMobileNav(!mobileNav)}
            className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={cn(
            "lg:col-span-3",
            mobileNav ? "block mb-6" : "hidden lg:block"
          )}
        >
          <div className="rounded-3xl bg-card border border-border p-5 shadow-soft space-y-1 lg:sticky lg:top-28">
            {/* User greeting */}
            {user && (
              <div className="pb-4 mb-2 border-b border-border">
                <p className="font-semibold text-primary truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}

            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/account" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNav(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-3 mt-3 border-t border-border space-y-1">
              <Button
                asChild
                variant="accent"
                size="sm"
                className="w-full rounded-xl gap-2"
              >
                <Link href="/donate">
                  <Heart className="w-4 h-4" /> Make a Donation
                </Link>
              </Button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-9 min-w-0 max-w-full">{children}</main>
      </div>
    </section>
  );
}
