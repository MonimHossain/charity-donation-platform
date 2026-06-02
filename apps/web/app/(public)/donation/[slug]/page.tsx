"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { createAutomatedSchedule, fetchDonationPageBySlug } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DonationExperience, DonationPageDto } from "@icac/shared-types";

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
    if (!slug) return;
    setLoading(true);
    fetchDonationPageBySlug(slug)
      .then((data) => setPage(isDonationPageDto(data) ? data : (data as DonationPageDto)))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const experience = useMemo(() => {
    const exp = page?.config?.experience as DonationExperience | undefined;
    return exp;
  }, [page]);

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
    return <RamadanSplitExperience page={page} experience={experience} />;
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
  const qs = new URLSearchParams();
  if (experience.defaultCampaignId) qs.set("campaign", experience.defaultCampaignId);
  const href = qs.toString() ? `/donate?${qs.toString()}` : "/donate";
  return (
    <PageShell title={page.title} description={page.shortDescription ?? ""}>
      <section className="container-wide py-20">
        <PageHero eyebrow={page.category} title={page.title} description={page.shortDescription ?? ""} />
        <div className="mt-8">
          <Button asChild size="lg" className="rounded-full bg-accent hover:bg-accent/90">
            <Link href={href}>Donate</Link>
          </Button>
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

  const selected = options.find((o) => o.key === selectedKey) ?? options[0];
  const min = experience.quantity?.min ?? 1;
  const max = experience.quantity?.max ?? 9999;
  const unitPrice = Number(selected?.unitPrice ?? 0);
  const boundedQty = Math.max(min, Math.min(max, Number.isFinite(qty) ? qty : min));
  const total = boundedQty * unitPrice;

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

            <Button
              size="lg"
              className="w-full rounded-full bg-accent hover:bg-accent/90 h-14 text-base"
              onClick={() => {
                const qs = new URLSearchParams();
                qs.set("amount", String(total));
                if (options.length) qs.set("cause", selectedKey);
                router.push(`/donate?${qs.toString()}`);
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

function normalizeBreakdown(total: number, weights: number[]): number[] {
  const clean = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sum = clean.reduce((s, w) => s + w, 0);
  const denom = sum > 0 ? sum : 1;
  const raw = clean.map((w) => (total * w) / denom);
  const rounded = raw.map((x) => Math.round(x * 100) / 100);
  const roundedSum = rounded.reduce((s, x) => s + x, 0);
  const diff = Math.round((total - roundedSum) * 100) / 100;
  if (rounded.length) rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + diff) * 100) / 100;
  return rounded;
}

function RamadanSplitExperience({
  page,
  experience,
}: {
  page: DonationPageDto;
  experience: Extract<DonationExperience, { type: "ramadan_split" }>;
}) {
  const router = useRouter();
  const nights = Math.max(1, Number(experience.nights || 30));

  const defaultStart = experience.startChoices?.[0]?.date ?? new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(defaultStart);

  const presetAmounts = [40, 50, 100, 250, 500, 1000, 5000];
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const baseTotal = customAmount ? Number(customAmount) : amount;
  const baseWeights = (experience.weights?.length ? experience.weights : Array.from({ length: nights }, () => 1)).slice(0, nights);

  const initialPresetId = experience.presets?.[0]?.id ?? "";
  const [presetId, setPresetId] = useState<string>(initialPresetId);

  const activeWeights = useMemo(() => {
    const preset = experience.presets?.find((p) => p.id === presetId);
    const w = preset?.weights?.length ? preset.weights : baseWeights;
    return w.slice(0, nights);
  }, [experience.presets, presetId, baseWeights, nights]);

  const dailyBreakdown = useMemo(() => normalizeBreakdown(Number(baseTotal) || 0, activeWeights), [baseTotal, activeWeights]);

  return (
    <PageShell title={page.title} description={page.shortDescription ?? ""}>
      <section className="container-wide py-16 sm:py-20">
        <PageHero eyebrow={page.category} title={page.title} description={page.shortDescription ?? ""} />

        <div className="mt-10 max-w-2xl mx-auto">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-6">
            <div className="rounded-full bg-accent text-accent-foreground text-center py-3 text-sm font-bold uppercase tracking-wider">
              Total is split across nights
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Amount</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {presetAmounts.map((a) => {
                  const active = !customAmount && amount === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setAmount(a);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "rounded-xl py-3 text-sm font-bold border transition-colors",
                        active ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border hover:border-primary/40"
                      )}
                    >
                      £ {a}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCustomAmount(String(baseTotal || ""))}
                  className={cn(
                    "rounded-xl py-3 text-sm font-bold border transition-colors",
                    customAmount ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border hover:border-primary/40"
                  )}
                >
                  Other
                </button>
              </div>
              <div className="mt-3">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Enter other amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Ramadan starts from</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(experience.startChoices ?? []).map((c) => {
                  const active = c.date === startDate;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setStartDate(c.date)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm border font-semibold transition-colors",
                        active ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border hover:border-primary/40"
                      )}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {experience.presets?.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Customize your {nights} nights</p>
                <div className="mt-2 grid gap-2">
                  {experience.presets.map((p) => {
                    const active = presetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPresetId(p.id)}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl text-sm font-semibold border transition-colors",
                          active ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border hover:border-primary/40"
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl bg-secondary/50 border border-border p-4 text-sm">
              <p className="font-semibold text-primary">Preview</p>
              <p className="text-muted-foreground mt-1">
                Total £{Number(baseTotal || 0).toFixed(2)} over {nights} nights · First night £{(dailyBreakdown[0] ?? 0).toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Your details</p>
              <Input value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Full name" className="rounded-xl h-11" />
              <Input value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="Email" type="email" className="rounded-xl h-11" />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <Button
              size="lg"
              className="w-full rounded-full bg-accent hover:bg-accent/90 h-14 text-base"
              disabled={submitting || !donorName || !donorEmail || !Number.isFinite(Number(baseTotal)) || Number(baseTotal) <= 0}
              onClick={async () => {
                setSubmitting(true);
                setError("");
                try {
                  await createAutomatedSchedule({
                    donorName,
                    donorEmail,
                    campaignId: experience.campaignId,
                    totalAmount: Number(baseTotal),
                    startDate,
                    dailyBreakdown,
                    currency: experience.currency ?? "GBP",
                    notes: `Ramadan split (${nights} nights)`,
                  });

                  // Collect payment upfront via existing donate flow (v1).
                  const qs = new URLSearchParams();
                  qs.set("amount", String(Number(baseTotal)));
                  qs.set("cause", "ramadan");
                  if (experience.campaignId) qs.set("campaign", experience.campaignId);
                  router.push(`/donate?${qs.toString()}`);
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : "Could not create schedule");
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "Processing…" : "Donate"}
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

