"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { fetchDonationPageBySlug } from "@/lib/api";
import { addDonationCartItem } from "@/lib/stores/donationCartStore";
import { cn } from "@/lib/utils";
import type { DonationExperience, DonationPageDto } from "@icac/shared-types";
import { toast } from "sonner";
import RamadanSplitExperience from "@/components/donation/RamadanSplitExperience";

function isDonationPageDto(x: unknown): x is DonationPageDto {
  return Boolean(
    x &&
      typeof x === "object" &&
      "id" in x &&
      "slug" in x &&
      "config" in x
  );
}

export default function DonationPageBySlug() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const router = useRouter();
  const [page, setPage] = useState<DonationPageDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug === "checkout") {
      router.replace("/donation/checkout");
      return;
    }
    if (!slug) return;
    setLoading(true);
    fetchDonationPageBySlug(slug)
      .then((data) => setPage(isDonationPageDto(data) ? data : (data as DonationPageDto)))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug, router]);

  const experience = useMemo(() => {
    const exp = page?.config?.experience as DonationExperience | undefined;
    return exp;
  }, [page]);

  if (slug === "checkout") {
    return (
      <div className="container-wide py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-wide py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page || !experience) {
    return (
      <PageShell title="Donation page" description="Donation page not found.">
        <section className="container-wide py-20">
          <PageHero
            eyebrow="Donate"
            title="Donation page not found"
            description="This donation page may be unpublished or the link is incorrect."
          />
          <div className="mt-8">
            <Button asChild className="rounded-full">
              <Link href="/donate">Go to Donate</Link>
            </Button>
          </div>
        </section>
      </PageShell>
    );
  }

  if (experience.type === "standard") {
    return <StandardExperience page={page} experience={experience} />;
  }
  if (experience.type === "zakat_calc") {
    return <ZakatExperience page={page} />;
  }
  if (experience.type === "fidya_kaffarah") {
    return <FidyaKaffarahExperience page={page} experience={experience} />;
  }
  if (experience.type === "ramadan_split") {
    return <RamadanSplitExperience page={page} experience={experience as Extract<DonationExperience, { type: "ramadan_split" }>} />;
  }

  return <UnsupportedExperience page={page} />;
}

function StandardExperience({
  page,
  experience,
}: {
  page: DonationPageDto;
  experience: Extract<DonationExperience, { type: "standard" }>;
}) {
  const router = useRouter();
  const presetAmounts = [10, 30, 50, 100, 250, 500];
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const currency = page.config?.currency ?? "GBP";
  const total = customAmount ? Number(customAmount) : amount;

  return (
    <PageShell title={page.title} description={page.shortDescription ?? ""}>
      <section className="container-wide py-16 sm:py-20">
        <PageHero eyebrow={page.category} title={page.title} description={page.shortDescription ?? ""} />
        <div className="mt-10 max-w-xl mx-auto">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAmount(a);
                    setCustomAmount("");
                  }}
                  className={cn(
                    "rounded-xl py-3 text-sm font-bold border transition-colors",
                    !customAmount && amount === a
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-background border-border hover:border-primary/40"
                  )}
                >
                  £ {a}
                </button>
              ))}
            </div>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Other amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="rounded-xl h-11"
            />
            <Button
              size="lg"
              className="w-full rounded-full bg-accent hover:bg-accent/90 h-14 text-base"
              disabled={!Number.isFinite(total) || total <= 0}
              onClick={() => {
                addDonationCartItem({
                  kind: "standard",
                  donationPageId: page.id,
                  donationPageSlug: page.slug,
                  title: page.title,
                  category: page.category,
                  amount: total,
                  currency,
                  description: `${page.title} — £${total.toFixed(2)}`,
                  campaignId: experience.defaultCampaignId ?? page.campaignId ?? undefined,
                  donationType: page.category,
                });
                toast.success("Added to cart");
                router.push("/donation/checkout");
              }}
            >
              Add to cart
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function ZakatExperience({ page }: { page: DonationPageDto }) {
  return (
    <PageShell title={page.title} description={page.shortDescription ?? ""}>
      <section className="container-wide py-20">
        <PageHero eyebrow={page.category} title={page.title} description={page.shortDescription ?? ""} />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full bg-accent hover:bg-accent/90">
            <Link href="/zakat">Open Zakat calculator</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/donate?cause=zakat">Donate Zakat</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

function FidyaKaffarahExperience({
  page,
  experience,
}: {
  page: DonationPageDto;
  experience: Extract<DonationExperience, { type: "fidya_kaffarah" }>;
}) {
  const router = useRouter();
  const options = experience.options ?? [];
  const initialKey = options[0]?.key ?? "fidya";
  const [selectedKey, setSelectedKey] = useState<string>(initialKey);
  const [qty, setQty] = useState<number>(experience.quantity?.default ?? experience.quantity?.min ?? 1);
  const [customAmount, setCustomAmount] = useState<string>("");

  const selected = options.find((o) => o.key === selectedKey) ?? options[0];
  const min = experience.quantity?.min ?? 1;
  const max = experience.quantity?.max ?? 9999;
  const unitPrice = Number(selected?.unitPrice ?? 0);
  const boundedQty = Math.max(min, Math.min(max, Number.isFinite(qty) ? qty : min));
  const computedTotal = boundedQty * unitPrice;
  const allowCustom = Boolean((experience as any).allowCustomAmount);
  const customMin = Number((experience as any).customAmount?.min ?? 1);
  const customMax = Number((experience as any).customAmount?.max ?? 100000);
  const customTotal = customAmount ? Number(customAmount) : NaN;
  const total = allowCustom && Number.isFinite(customTotal)
    ? Math.max(customMin, Math.min(customMax, customTotal))
    : computedTotal;

  return (
    <PageShell title={page.title} description={page.shortDescription ?? ""}>
      <section className="container-wide py-16 sm:py-20">
        <PageHero eyebrow={page.category} title={page.title} description={page.shortDescription ?? ""} />

        <div className="mt-10 max-w-xl mx-auto">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-5">
            <div className="rounded-full border border-primary/30 bg-secondary p-1 flex">
              {options.map((opt) => {
                const active = opt.key === selectedKey;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedKey(opt.key)}
                    className={cn(
                      "flex-1 py-3 rounded-full text-sm sm:text-base font-semibold transition-colors",
                      active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-full bg-accent text-accent-foreground text-center py-4 text-2xl font-bold tabular-nums">
              £ {Number.isFinite(total) ? total.toFixed(0) : "0"}
            </div>

            <div className="flex items-center gap-3">
              <p className="font-semibold text-foreground min-w-[90px]">{experience.quantity?.label ?? "Quantity:"}</p>
              <Input
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="rounded-full h-12 text-center"
              />
            </div>

            {allowCustom && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                  {(experience as any).customAmount?.label ?? "Custom amount"}
                </p>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={customMin}
                  max={customMax}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={String((experience as any).customAmount?.placeholder ?? "Enter amount")}
                  className="rounded-xl h-11"
                />
                <p className="text-xs text-muted-foreground">
                  If filled, this overrides the calculated total.
                </p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full rounded-full bg-accent hover:bg-accent/90 h-14 text-base"
              disabled={!Number.isFinite(total) || total <= 0}
              onClick={() => {
                const label = selected?.label ?? selectedKey;
                addDonationCartItem({
                  kind: "fidya_kaffarah",
                  donationPageId: page.id,
                  donationPageSlug: page.slug,
                  title: page.title,
                  category: page.category,
                  amount: total,
                  currency: page.config?.currency ?? "GBP",
                  quantity: boundedQty,
                  unitPrice: allowCustom && Number.isFinite(customTotal) ? total / boundedQty : unitPrice,
                  description: `${label} × ${boundedQty} — £${total.toFixed(2)}`,
                  campaignId: page.campaignId ?? undefined,
                  donationType: selectedKey,
                  fidya: { optionKey: selectedKey, optionLabel: label },
                });
                toast.success("Added to cart");
                router.push("/donation/checkout");
              }}
            >
              Add to cart
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function UnsupportedExperience({ page }: { page: DonationPageDto }) {
  return (
    <PageShell title={page.title} description={page.shortDescription ?? ""}>
      <section className="container-wide py-20">
        <PageHero eyebrow={page.category} title={page.title} description={page.shortDescription ?? ""} />
        <p className="mt-6 text-muted-foreground">This donation experience isn’t supported yet.</p>
        <div className="mt-8 flex gap-3">
          <Button asChild className="rounded-full">
            <Link href="/donate">Go to Donate</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

