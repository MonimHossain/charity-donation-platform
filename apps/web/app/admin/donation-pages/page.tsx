"use client";

import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2, Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDonationPagesAdmin, useDonationPageMutations } from "@/lib/data/donation-pages";
import { USE_MOCK_DATA } from "@/lib/config";
import { createDonationPage as storeCreate } from "@/lib/stores/donationPageStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AdminDonationPagesPage() {
  const router = useRouter();
  const { data: pages, isLoading, refetch } = useDonationPagesAdmin();
  const { create, remove, update } = useDonationPageMutations();

  async function handleCreate() {
    if (USE_MOCK_DATA) {
      const p = storeCreate();
      toast.success("Page created");
      router.push(`/admin/donation-pages/${p.id}/edit`);
      return;
    }
    // New UX: do not create immediately; open the create screen.
    router.push("/admin/donation-pages/new");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-primary">Donation pages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Universal donation engine — synced with API when mock mode is off.
          </p>
        </div>
        <Button
          className="rounded-full bg-accent hover:bg-accent/90"
          onClick={handleCreate}
          disabled={create.isPending}
        >
          <Plus className="w-4 h-4" /> New page
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pages.map((p: { id: string; category?: string; title: string; shortDescription?: string; status?: string }) => (
            <div key={p.id} className="rounded-2xl bg-card border border-border p-5">
              <p className="text-xs uppercase tracking-widest text-accent-deep font-semibold">{p.category}</p>
              <h3 className="font-serif text-lg text-primary mt-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.shortDescription || "—"}</p>
              <p className="mt-2 text-xs text-muted-foreground capitalize">Status: {p.status || "draft"}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" asChild className="rounded-full">
                  <Link href={`/admin/donation-pages/${p.id}/edit`}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={async () => {
                    try {
                      const nextStatus = p.status === "archived" ? "published" : "archived";
                      await update.mutateAsync({ id: p.id, payload: { status: nextStatus } });
                      toast.success(nextStatus === "archived" ? "Archived" : "Restored");
                      refetch();
                    } catch {
                      toast.error("Update failed");
                    }
                  }}
                >
                  {p.status === "archived" ? (
                    <><ArchiveRestore className="w-3.5 h-3.5" /> Restore</>
                  ) : (
                    <><Archive className="w-3.5 h-3.5" /> Archive</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-destructive"
                  onClick={async () => {
                    try {
                      await remove.mutateAsync(p.id);
                      toast.success("Deleted");
                      refetch();
                    } catch {
                      toast.error("Delete failed");
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {pages.length === 0 && (
            <p className="text-muted-foreground col-span-full">No donation pages yet. Create one to get started.</p>
          )}
        </div>
      )}
    </div>
  );
}
