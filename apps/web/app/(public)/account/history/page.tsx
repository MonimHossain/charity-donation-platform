"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Download,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchUserDonations, fetchDonationReceipt } from "@/lib/api";
import { useCurrency } from "@/lib/currency";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  campaign?: string;
  frequency: string;
  status: string;
  giftAid: boolean;
  createdAt: string;
}

const STATUSES = ["all", "completed", "pending", "failed", "refunded"];
const PER_PAGE = 10;

export default function DonationHistoryPage() {
  const { formatMoney } = useCurrency();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

  const downloadReceipt = async (id: string) => {
    setReceiptLoadingId(id);
    try {
      const receipt = await fetchDonationReceipt(id);
      const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receipt.receiptNumber || id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setReceiptLoadingId(null);
    }
  };

  useEffect(() => {
    fetchUserDonations()
      .then((res) => setDonations(res.items || res.data || res.donations || res || []))
      .catch(() => setDonations([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return donations.filter((d) => {
      if (
        statusFilter !== "all" &&
        d.status.toLowerCase() !== statusFilter
      )
        return false;
      if (
        search &&
        !(d.campaign || "").toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (dateFrom && new Date(d.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(d.createdAt) > new Date(dateTo + "T23:59:59"))
        return false;
      return true;
    });
  }, [donations, statusFilter, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl text-primary">
          Donation History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage all your past donations.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="rounded-3xl bg-card border border-border p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by campaign name..."
              className="pl-10 h-10 rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
            <div>
              <label className="text-xs text-muted-foreground font-medium">
                Status
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setPage(1);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all",
                      statusFilter === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs text-muted-foreground font-medium">
                  From
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 h-9 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">
                  To
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 h-9 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-card border border-border shadow-soft overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground mt-3">No donations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground bg-secondary/30">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">
                    Campaign
                  </th>
                  <th className="px-6 py-3 font-medium hidden sm:table-cell">
                    Type
                  </th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((don) => (
                  <tr
                    key={don.id}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(don.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold tabular-nums">
                      {formatMoney(don.amount, { from: don.currency })}
                      {don.giftAid && (
                        <span className="text-xs text-accent-deep ml-1">+GA</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                      {don.campaign || "General"}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground capitalize">
                      {don.frequency}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
                          don.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : don.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : don.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        {don.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg gap-1.5 text-xs"
                        disabled={don.status !== "completed" || receiptLoadingId === don.id}
                        onClick={() => downloadReceipt(don.id)}
                      >
                        {receiptLoadingId === don.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}{" "}
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                )
                .map((p, idx, arr) => (
                  <span key={p} className="contents">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-muted-foreground">&hellip;</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                        p === page
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
