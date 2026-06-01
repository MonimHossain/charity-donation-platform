"use client";

import { USE_MOCK_DATA } from "@/lib/config";
import MockCharitiesList from "./MockCharitiesList";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchPublicCharities } from "@/lib/api";
import CharityCard, { type CharityCardData } from "@/components/public/CharityCard";
import Pagination from "@/components/public/Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/format";

export default function CharitiesPage() {
  if (USE_MOCK_DATA) return <MockCharitiesList />;
  return <CharitiesPageApi />;
}

function CharitiesPageApi() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [charities, setCharities] = useState<CharityCardData[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const country = searchParams.get("country") || "";

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: "12" };
    if (search) params.search = search;
    if (country) params.country = country;

    fetchPublicCharities(params)
      .then((res: any) => {
        const items = (res.data || res || []).map((c: any) => ({
          name: c.name,
          slug: c.slug,
          country: c.country,
          logoUrl: c.logoUrl,
          auditStatus: c.auditStatus,
          auditDate: c.auditDate ? formatDate(c.auditDate) : "Pending",
          certification: c.certification
            ? {
                status: c.certification.status,
                certificateId: c.certification.certificateId,
                issueDate: formatDate(c.certification.issueDate),
                expiryDate: formatDate(c.certification.expiryDate),
              }
            : null,
        }));
        setCharities(items);
        setMeta(res.meta || { page: 1, limit: 12, total: items.length, totalPages: 1 });
      })
      .catch(() => setCharities([]))
      .finally(() => setLoading(false));
  }, [page, search, country]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    if (country) params.set("country", country);
    router.push(`/charities?${params.toString()}`);
  };

  return (
    <div className="bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Directory
          </p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
            Audited Charity Directory
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse audited charities, filter by country and audit status, and verify trust
            information.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex gap-3 mb-10">
          <Input
            placeholder="Search charities..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : charities.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No charities found matching your criteria.
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {charities.map((charity) => (
                <CharityCard key={charity.slug} charity={charity} />
              ))}
            </div>
            <div className="mt-10">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                basePath="/charities"
                query={{ search: search || undefined, country: country || undefined }}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
