"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchMyReviews, submitDonorReview } from "@/lib/api";

interface MyReview {
  id: string;
  quote: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export function AccountReviewCard() {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyReviews()
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    if (!quote.trim()) {
      toast.error("Please write your review");
      return;
    }
    setSubmitting(true);
    try {
      const created = await submitDonorReview({ quote: quote.trim(), rating });
      setReviews((prev) => [created, ...prev]);
      setQuote("");
      setRating(5);
      toast.success("Thank you! Your review is pending approval.");
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const latest = reviews[0];

  return (
    <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareQuote className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-xl text-primary">Write a review</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Share your experience — approved reviews appear on our homepage.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          {latest && (
            <div className="mb-4 rounded-xl bg-secondary/50 border border-border px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                Your latest review ({new Date(latest.createdAt).toLocaleDateString()}):{" "}
                <span
                  className={cn(
                    "font-semibold capitalize",
                    latest.status === "approved" && "text-emerald-700",
                    latest.status === "pending" && "text-amber-700",
                    latest.status === "rejected" && "text-red-700"
                  )}
                >
                  {latest.status}
                </span>
              </p>
              {latest.status === "rejected" && (
                <p className="text-xs text-muted-foreground mt-1">You can submit a new review below.</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} stars`}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "w-6 h-6",
                        n <= rating ? "fill-accent text-accent" : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Your review</Label>
              <textarea
                rows={4}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Tell others about your experience donating..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting || (latest?.status === "pending")}
              className="rounded-full"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit review"}
            </Button>
            {latest?.status === "pending" && (
              <p className="text-xs text-muted-foreground">You already have a review awaiting approval.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
