"use client";

import { User } from "lucide-react";

interface AdminAccountMenuProps {
  name?: string;
  email?: string;
}

export function AdminAccountMenu({ name, email }: AdminAccountMenuProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-medium leading-tight">{name || "Admin"}</p>
        <p className="text-xs text-muted-foreground">{email || ""}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}
