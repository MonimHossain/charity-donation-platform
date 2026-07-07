"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Star,
  Check,
  X,
  MessageSquareQuote,
} from "lucide-react";
import RequirePermission from "@/components/admin/RequirePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  fetchAdminReviews,
  createAdminReview,
  updateAdminReview,
  deleteAdminReview,
} from "@/lib/api";

type ReviewStatus = "pending" | "approved" | "rejected" | "all";

interface Review {
  id: string;
  name: string;
  role?: string;
  location?: string;
  quote: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  source: "donor" | "admin";
  createdAt: string;
}

const STATUS_TABS: { key: ReviewStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const emptyForm = {
  name: "",
  role: "",
  location: "",
  quote: "",
  rating: 5,
};

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5"
          aria-label={`${n} stars`}
        >
          <Star
            className={cn(
              "h-5 w-5",
              n <= value ? "fill-accent text-accent" : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [statusTab, setStatusTab] = useState<ReviewStatus>("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReviews(statusTab === "all" ? undefined : statusTab);
      setReviews(Array.isArray(data) ? data : data?.items ?? []);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(review: Review) {
    setEditing(review);
    setForm({
      name: review.name,
      role: review.role ?? "",
      location: review.location ?? "",
      quote: review.quote,
      rating: review.rating,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.quote.trim()) {
      toast.error("Name and review text are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAdminReview(editing.id, {
          name: form.name.trim(),
          role: form.role.trim() || undefined,
          location: form.location.trim() || undefined,
          quote: form.quote.trim(),
          rating: form.rating,
        });
        toast.success("Review updated");
      } else {
        await createAdminReview({
          name: form.name.trim(),
          role: form.role.trim() || undefined,
          location: form.location.trim() || undefined,
          quote: form.quote.trim(),
          rating: form.rating,
        });
        toast.success("Review published");
      }
      setModalOpen(false);
      await loadReviews();
    } catch {
      toast.error("Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: "approved" | "rejected") {
    try {
      await updateAdminReview(id, { status });
      toast.success(status === "approved" ? "Review approved" : "Review rejected");
      await loadReviews();
    } catch {
      toast.error("Failed to update review");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    try {
      await deleteAdminReview(id);
      toast.success("Review deleted");
      await loadReviews();
    } catch {
      toast.error("Failed to delete review");
    }
  }

  return (
    <RequirePermission permission="reviews.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight">Reviews</h1>
            <p className="text-muted-foreground mt-1">Approve donor submissions or write reviews manually</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Write review
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 w-fit overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusTab(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                statusTab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16 border rounded-xl">
            No reviews in this tab.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border bg-card p-4 shadow-soft space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{review.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.role || review.location || (review.source === "donor" ? "Donor" : "Admin")}
                      {" · "}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex mt-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-xs uppercase tracking-wide px-2 py-0.5 rounded-full",
                      review.status === "approved" && "bg-emerald-100 text-emerald-800",
                      review.status === "pending" && "bg-amber-100 text-amber-800",
                      review.status === "rejected" && "bg-red-100 text-red-800"
                    )}
                  >
                    {review.status}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">&ldquo;{review.quote}&rdquo;</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {review.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => setStatus(review.id, "approved")}>
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(review.id, "rejected")}>
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(review)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(review.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5" />
                {editing ? "Edit review" : "Write review"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location / role</Label>
                  <Input
                    value={form.location || form.role}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, location: e.target.value, role: e.target.value }))
                    }
                    placeholder="e.g. London"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <StarPicker value={form.rating} onChange={(rating) => setForm((p) => ({ ...p, rating }))} />
              </div>
              <div className="space-y-2">
                <Label>Review</Label>
                <textarea
                  rows={4}
                  value={form.quote}
                  onChange={(e) => setForm((p) => ({ ...p, quote: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequirePermission>
  );
}
