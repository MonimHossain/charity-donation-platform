import type { ElementType } from "react";
import {
  LayoutDashboard,
  Megaphone,
  HandCoins,
  CreditCard,
  FileText,
  Sparkles,
  Settings,
  Coins,
  Mail,
  BarChart3,
  Users,
  Repeat,
  Tag,
  Activity,
  Clock,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: ElementType;
  permission: string;
  superAdminOnly?: boolean;
  children?: { label: string; href: string; icon: ElementType; permission?: string }[];
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "analytics.view" },
  { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone, permission: "campaigns.view" },
  { label: "Upsells", href: "/admin/upsells", icon: Sparkles, permission: "upsells.view" },
  { label: "Quick Donate Form", href: "/admin/quick-donate", icon: Coins, permission: "quick_donate.view" },
  { label: "Donations", href: "/admin/donations", icon: HandCoins, permission: "donations.view" },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, permission: "payments.view" },
  { label: "Recurring", href: "/admin/recurring", icon: Repeat, permission: "recurring.view" },
  { label: "Automated", href: "/admin/automated", icon: Clock, permission: "automated.view" },
  { label: "Users", href: "/admin/users", icon: Users, permission: "donor_users.view" },
  {
    label: "Blog",
    href: "/admin/blog",
    icon: FileText,
    permission: "blog.view",
    children: [
      { label: "Posts", href: "/admin/blog", icon: FileText },
      { label: "Categories", href: "/admin/blog/categories", icon: Tag },
    ],
  },
  { label: "Reviews", href: "/admin/reviews", icon: Star, permission: "reviews.view" },
  {
    label: "Email",
    href: "/admin/email/templates",
    icon: Mail,
    permission: "email.view",
    children: [
      { label: "Templates", href: "/admin/email/templates", icon: FileText },
      { label: "Send", href: "/admin/email/send", icon: Send },
      { label: "Campaigns", href: "/admin/email/campaigns", icon: Megaphone },
      { label: "Logs", href: "/admin/email/logs", icon: Activity },
      { label: "Subscribers", href: "/admin/newsletter", icon: Users },
    ],
  },
  { label: "Activity Log", href: "/admin/activity", icon: Activity, permission: "activity.view" },
  { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings.view" },
  {
    label: "User Management",
    href: "/admin/admin-users",
    icon: ShieldCheck,
    permission: "admins.view",
    superAdminOnly: true,
  },
];

export function filterAdminNavItems(
  items: AdminNavItem[],
  canAccess: (permission: string, superAdminOnly?: boolean) => boolean
): AdminNavItem[] {
  return items
    .filter((item) => canAccess(item.permission, item.superAdminOnly))
    .map((item) => {
      if (!item.children) return item;
      return { ...item, children: item.children };
    });
}
