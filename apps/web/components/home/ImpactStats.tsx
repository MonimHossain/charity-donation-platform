"use client";

import { impactStats as fallbackStats } from "@/lib/mock/home";
import { useImpactStats } from "@/lib/data/cms";

const ImpactStats = () => {
  const { data: statsData } = useImpactStats();
  const stats = statsData?.length ? statsData : fallbackStats;

  return (
  <section className="bg-primary text-primary-foreground">
    <div className="container-wide py-20 grid lg:grid-cols-3 gap-8 lg:gap-12">
      {stats.map((s) => (
        <div key={s.label} className="border-l-2 border-accent pl-6">
          <p className="font-serif text-5xl md:text-6xl font-semibold text-plum leading-none">{s.value}</p>
          <h3 className="mt-4 text-xl font-medium">{s.label}</h3>
        </div>
      ))}
    </div>
  </section>
  );
};

export default ImpactStats;
