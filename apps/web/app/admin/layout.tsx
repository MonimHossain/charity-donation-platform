"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fetchAdminProfile, adminLogout } from "@/lib/api";
import { AdminSessionProvider, useAdminSession } from "@/components/admin/AdminSessionProvider";
import { AdminPageGuard, canAccessAdminNav } from "@/components/admin/AdminPageGuard";
import { adminNavItems, filterAdminNavItems, type AdminNavItem } from "@/lib/adminNav";
import { AdminAccountMenu } from "@/components/admin/AdminAccountMenu";
import { AdminNotificationBell } from "@/components/notifications/AdminNotificationBell";
import {
  DEFAULT_DEMO_ADMIN_PROFILE,
  isMockAdminSession,
  isValidAdminToken,
  purgeStaleAdminTokens,
} from "@/lib/admin-auth";

function SidebarLink({
  item,
  pathname,
  collapsed,
}: {
  item: AdminNavItem;
  pathname: string;
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  );

  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  open && "rotate-180"
                )}
              />
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-3">
            {item.children.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    childActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <child.icon className="h-4 w-4 shrink-0" />
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminSessionProvider>
  );
}

function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAdminSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<{ name?: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login" || pathname === "/admin/forgot-password" || pathname === "/admin/reset-password") {
      setAuthChecked(true);
      return;
    }

    purgeStaleAdminTokens();
    const token = localStorage.getItem("admin_token");
    if (!isValidAdminToken(token)) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_profile");
      router.replace("/admin/login");
      return;
    }

    const cached = localStorage.getItem("admin_profile");
    if (cached) {
      try {
        setAdmin(JSON.parse(cached));
      } catch {}
    }

    if (isMockAdminSession(token)) {
      if (!cached) {
        setAdmin(DEFAULT_DEMO_ADMIN_PROFILE);
        localStorage.setItem("admin_profile", JSON.stringify(DEFAULT_DEMO_ADMIN_PROFILE));
      }
      setAuthChecked(true);
      return;
    }

    const justLoggedIn = sessionStorage.getItem("admin_just_logged_in") === "1";

    // Show the panel immediately when we already have a valid token (login just wrote profile).
    setAuthChecked(true);

    void fetchAdminProfile()
      .then((profile) => {
        sessionStorage.removeItem("admin_just_logged_in");
        setAdmin(profile);
        localStorage.setItem("admin_profile", JSON.stringify(profile));
      })
      .catch((err: { response?: { status?: number; data?: { message?: string } } }) => {
        const status = err?.response?.status;

        if (justLoggedIn && (status === 401 || status === 403)) {
          sessionStorage.removeItem("admin_just_logged_in");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_profile");
          setAuthChecked(false);
          toast.error(
            err?.response?.data?.message ||
              "Sign-in failed: the API rejected your session. Try again or restart the API."
          );
          router.replace("/admin/login");
          return;
        }

        if (status === 401 || status === 403) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_profile");
          setAuthChecked(false);
          toast.error("Session expired. Please sign in again.");
          router.replace("/admin/login");
          return;
        }

        sessionStorage.removeItem("admin_just_logged_in");
        if (!cached) {
          toast.error(
            err?.response?.data?.message ||
              "Cannot reach admin API. Is the database running?"
          );
          router.replace("/admin/login");
        }
      });
  }, [pathname, router]);

  async function handleLogout() {
    try {
      await adminLogout();
    } catch {}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_profile");
    toast.success("Logged out successfully");
    router.replace("/admin/login");
  }

  const visibleNavItems = filterAdminNavItems(adminNavItems, (permission, superAdminOnly) =>
    canAccessAdminNav(session, permission, superAdminOnly)
  );

  if (pathname === "/admin/login" || pathname === "/admin/forgot-password" || pathname === "/admin/reset-password") {
    return <>{children}</>;
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif font-bold text-sm leading-tight">
              Charity Admin
            </p>
            <p className="text-xs text-muted-foreground">Management Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Separator />

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => (
            <SidebarLink
              key={item.label}
              item={item}
              pathname={pathname}
              collapsed={false}
            />
          ))}
        </nav>

        <Separator />

        <div className="p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <AdminNotificationBell />

          <AdminAccountMenu
            name={admin?.name || (admin as { fullName?: string })?.fullName}
            email={admin?.email}
          />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AdminPageGuard>{children}</AdminPageGuard>
        </main>
      </div>
    </div>
  );
}
