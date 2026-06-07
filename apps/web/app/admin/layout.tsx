"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Megaphone,
  HandCoins,
  CreditCard,
  FileText,
  ImageIcon,
  Layers,
  Settings,
  Coins,
  Mail,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Heart,
  User,
  BarChart3,
  Users,
  Repeat,
  Navigation,
  Flag,
  PanelBottom,
  Search,
  Image,
  FileStack,
  Tag,
  HelpCircle,
  Globe,
  Activity,
  Clock,
  Calculator,
  ClipboardList,
  AlertTriangle,
  MessageSquare,
  Inbox,
  History,
  Lock,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fetchAdminProfile, adminLogout } from "@/lib/api";
import { AdminSessionProvider } from "@/components/admin/AdminSessionProvider";
import {
  DEFAULT_DEMO_ADMIN_PROFILE,
  isMockAdminSession,
  isValidAdminToken,
  purgeStaleAdminTokens,
} from "@/lib/admin-auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Overview", href: "/admin/dashboard-overview", icon: PieChart },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
  { label: "Donation pages", href: "/admin/donation-pages", icon: Heart },
  { label: "Donations", href: "/admin/donations", icon: HandCoins },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Recurring", href: "/admin/recurring", icon: Repeat },
  { label: "Automated", href: "/admin/automated", icon: Clock },
  { label: "Users", href: "/admin/users", icon: Users },
  {
    label: "Submissions",
    href: "/admin/applications",
    icon: ClipboardList,
    children: [
      { label: "Applications", href: "/admin/applications", icon: ClipboardList },
      { label: "Concerns", href: "/admin/concerns", icon: AlertTriangle },
      { label: "Contact Messages", href: "/admin/contact-messages", icon: MessageSquare },
    ],
  },
  {
    label: "Blog",
    href: "/admin/blog",
    icon: FileText,
    children: [
      { label: "Posts", href: "/admin/blog", icon: FileText },
      { label: "Categories", href: "/admin/blog/categories", icon: Tag },
    ],
  },
  {
    label: "CMS",
    href: "/admin/cms",
    icon: Layers,
    children: [
      { label: "Hero", href: "/admin/cms/hero", icon: ImageIcon },
      { label: "Sections", href: "/admin/cms/sections", icon: Layers },
      { label: "Pages", href: "/admin/cms/pages", icon: FileStack },
      { label: "Menus", href: "/admin/cms/menus", icon: Navigation },
      { label: "Banners", href: "/admin/cms/banners", icon: Flag },
      { label: "Footer", href: "/admin/cms/footer", icon: PanelBottom },
      { label: "FAQs", href: "/admin/cms/faqs", icon: HelpCircle },
      { label: "File Manager", href: "/admin/cms/media", icon: Image },
      { label: "SEO", href: "/admin/cms/seo", icon: Search },
      { label: "Languages", href: "/admin/cms/languages", icon: Globe },
      { label: "Presets", href: "/admin/cms/presets", icon: Coins },
      { label: "Settings", href: "/admin/cms/settings", icon: Settings },
    ],
  },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  {
    label: "Admin",
    href: "/admin/roles",
    icon: Lock,
    children: [
      { label: "Roles", href: "/admin/roles", icon: Lock },
      { label: "Admin Users", href: "/admin/admin-users", icon: Users },
      { label: "History", href: "/admin/history", icon: History },
    ],
  },
  { label: "Activity Log", href: "/admin/activity", icon: Activity },
  { label: "Demo logs", href: "/admin/logs", icon: History },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function SidebarLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
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
  const pathname = usePathname();
  const router = useRouter();
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

    fetchAdminProfile()
      .then((profile) => {
        sessionStorage.removeItem("admin_just_logged_in");
        setAdmin(profile);
        localStorage.setItem("admin_profile", JSON.stringify(profile));
        setAuthChecked(true);
      })
      .catch((err: { response?: { status?: number; data?: { message?: string } } }) => {
        const status = err?.response?.status;

        if (justLoggedIn && (status === 401 || status === 403)) {
          sessionStorage.removeItem("admin_just_logged_in");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_profile");
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
          toast.error("Session expired. Please sign in again.");
          router.replace("/admin/login");
          return;
        }

        sessionStorage.removeItem("admin_just_logged_in");
        if (cached) {
          setAuthChecked(true);
          return;
        }
        toast.error(
          err?.response?.data?.message ||
            "Cannot reach admin API. Is the database running?"
        );
        router.replace("/admin/login");
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
          {navItems.map((item) => (
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

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">
                {admin?.name || (admin as any)?.fullName || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground">
                {admin?.email || ""}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AdminSessionProvider>{children}</AdminSessionProvider>
        </main>
      </div>
    </div>
  );
}
