"use client";

import { statValueClass } from "@/lib/home-buttons";
import { useImpactStats } from "@/lib/data/cms";

const ImpactStats = () => {
  const { data: statsData, isLoading } = useImpactStats();
  const stats = statsData ?? [];

  if (isLoading) return null;
  if (stats.length === 0) return null;

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="container-wide py-16 md:py-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
        {stats.map((s) => (
          <div key={s.label} className="border-l-2 border-accent pl-4 md:pl-6 min-w-0">
            <p className={statValueClass}>{s.value}</p>
            <h3 className="mt-3 md:mt-4 text-base md:text-xl font-medium leading-snug">{s.label}</h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ImpactStats;
