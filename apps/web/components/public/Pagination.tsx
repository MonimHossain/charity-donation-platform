import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}

function buildHref(basePath: string, query: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  params.set('page', String(page));
  return `${basePath}?${params.toString()}`;
}

export default function Pagination({ page, totalPages, basePath, query = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const previous = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-6 py-4 text-sm">
      <p className="text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(basePath, query, previous)}
          className="rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary hover:bg-primary/5 transition-colors"
        >
          Previous
        </Link>
        <Link
          href={buildHref(basePath, query, next)}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Next
        </Link>
      </div>
    </div>
  );
}
