"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRolesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/admin-users");
  }, [router]);

  return null;
}
