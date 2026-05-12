"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  className?: string;
}

export default function CountdownTimer({ targetDate, label = "Campaign ends in", className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (expired) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground text-sm ${className}`}>
        <Clock className="h-4 w-4" /> Campaign has ended
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        <span className="font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex gap-2">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hrs" },
          { value: timeLeft.minutes, label: "Min" },
          { value: timeLeft.seconds, label: "Sec" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center bg-primary/5 rounded-lg px-3 py-2 min-w-[52px]">
            <span className="text-xl font-bold text-primary tabular-nums">
              {String(item.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
