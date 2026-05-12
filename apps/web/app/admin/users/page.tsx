"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserX,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Donor {
  id: string;
  name: string;
  email: string;
  totalDonated: number;
  donationCount: number;
  status: string;
  createdAt: string;
}

export default function UsersPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const limit = 20;

  async function loadDonors() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      const { data } = await api.get("/admin/users", { params });
      const items = data.items || data.donors || data || [];
      setDonors(Array.isArray(items) ? items : []);
      setTotalPages(data.totalPages || Math.ceil((data.total || items.length) / limit));
      setTotal(data.total || items.length);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDonors();
  }, [page]);

  function handleSearch() {
    setPage(1);
    loadDonors();
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this user?")) return;
    try {
      await api.put(`/admin/users/${id}/deactivate`);
      toast.success("User deactivated");
      loadDonors();
    } catch {
      toast.error("Failed to deactivate user");
    }
  }

  function handleExport() {
    const headers = ["Name", "Email", "Total Donated", "Donation Count", "Status", "Joined"];
    const rows = donors.map((d) => [
      d.name,
      d.email,
      String(d.totalDonated || 0),
      String(d.donationCount || 0),
      d.status || "active",
      d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donors-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusStyles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-slate-100 text-slate-600",
    deactivated: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Users &amp; Donors</h1>
          <p className="text-muted-foreground mt-1">Manage all registered donors ({total} total)</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading users...
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Total Donated</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Donations</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Joined</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.length > 0 ? donors.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium">{d.name || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{d.email}</td>
                      <td className="px-5 py-3 font-semibold">
                        £{Number(d.totalDonated || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{d.donationCount || 0}</td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusStyles[d.status] || "bg-green-100 text-green-700")}>
                          {d.status || "active"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDonor(d)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeactivate(d.id)}
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-lg m-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold">Donor Profile</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDonor(null)}>Close</Button>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold">{selectedDonor.name || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground">{selectedDonor.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold">£{Number(selectedDonor.totalDonated || 0).toLocaleString("en-GB")}</p>
                  <p className="text-xs text-muted-foreground">Total Donated</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold">{selectedDonor.donationCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Donations</p>
                </div>
              </div>
              <div className="text-sm">
                <p><span className="text-muted-foreground">Status:</span> <span className="capitalize font-medium">{selectedDonor.status || "active"}</span></p>
                <p><span className="text-muted-foreground">Joined:</span> {selectedDonor.createdAt ? new Date(selectedDonor.createdAt).toLocaleDateString() : "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
