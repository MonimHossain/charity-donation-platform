const CONFIG: Record<string, { label: string; classes: string }> = {
  LOW: { label: 'Low Risk', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  MEDIUM: { label: 'Medium Risk', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
  HIGH: { label: 'High Risk', classes: 'bg-red-50 text-red-700 border border-red-200' },
};

export default function RiskLevelBadge({ riskLevel, className = '' }: { riskLevel?: string | null; className?: string }) {
  if (!riskLevel) return null;
  const config = CONFIG[riskLevel];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase ${config.classes} ${className}`}>
      {config.label}
    </span>
  );
}
