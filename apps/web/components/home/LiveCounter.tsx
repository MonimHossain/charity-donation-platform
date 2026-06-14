"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Users, TrendingUp, Globe } from "lucide-react";
import { useCurrency } from "@/lib/currency";

interface CounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

function AnimatedCounter({ target, prefix = "", suffix = "", duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="text-3xl sm:text-4xl font-bold text-primary tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

const stats = [
  { icon: Heart, label: "Total Donated", value: 1420000, fromGbp: true, suffix: "+", color: "text-accent" },
  { icon: Users, label: "Generous Donors", value: 28400, fromGbp: false, suffix: "+", color: "text-blue-500" },
  { icon: TrendingUp, label: "Monthly Givers", value: 3200, fromGbp: false, suffix: "+", color: "text-emerald-500" },
  { icon: Globe, label: "Countries Reached", value: 42, fromGbp: false, suffix: "", color: "text-purple-500" },
];

export default function LiveCounter() {
  const { symbol, convertToDisplay } = useCurrency();

  return (
    <section className="bg-primary/[0.03] py-12 sm:py-16">
      <div className="container-wide">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {stats.map((stat) => {
            const displayValue = stat.fromGbp ? convertToDisplay(stat.value, "GBP") : stat.value;
            return (
              <div key={stat.label} className="text-center">
                <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                <AnimatedCounter
                  target={Math.round(displayValue)}
                  prefix={stat.fromGbp ? symbol : ""}
                  suffix={stat.suffix}
                />
                <p className="mt-1 text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
