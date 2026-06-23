import type { AutomatedDonationSchedule } from "../../components/automatedDonation/automatedDonation.entity.js";

type InstallmentRow = NonNullable<AutomatedDonationSchedule["installments"]>[number];

export function getNextInstallmentDate(
  schedule: Pick<AutomatedDonationSchedule, "installments" | "startDate" | "status">
): string | null {
  const installments = schedule.installments;
  if (installments?.length) {
    const pending = installments
      .filter((row) => row.status === "pending")
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    return pending[0]?.scheduledDate ?? null;
  }

  if (["completed", "cancelled"].includes(schedule.status)) return null;
  const start =
    schedule.startDate instanceof Date
      ? schedule.startDate.toISOString().slice(0, 10)
      : String(schedule.startDate).slice(0, 10);
  return start || null;
}

export function serializeAutomatedSchedule(schedule: AutomatedDonationSchedule) {
  return {
    id: schedule.id,
    automationType: "installment_schedule" as const,
    donorName: schedule.donorName,
    donorEmail: schedule.donorEmail,
    totalAmount: Number(schedule.totalAmount),
    dailyAmount: Number(schedule.dailyAmount),
    paidAmount: Number(schedule.paidAmount),
    completedDays: schedule.completedDays,
    totalDays: schedule.totalDays,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    status: schedule.status,
    currency: schedule.currency,
    installments: schedule.installments,
    campaign: schedule.campaign
      ? { title: schedule.campaign.title }
      : undefined,
    nextScheduledDate: getNextInstallmentDate(schedule),
    createdAt: schedule.createdAt,
  };
}

export function isUpcomingAutomatedStatus(status: string): boolean {
  return ["active", "scheduled", "awaiting_payment_method", "paused"].includes(status);
}

export function serializeRecurringAsAutomation(item: {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number | string;
  currency: string;
  frequency: string;
  status: string;
  nextPaymentDate?: Date | string | null;
  totalPaid?: number | string;
  createdAt: Date | string;
  campaign?: { title?: string } | null;
}) {
  const next =
    item.nextPaymentDate instanceof Date
      ? item.nextPaymentDate.toISOString()
      : item.nextPaymentDate
        ? String(item.nextPaymentDate)
        : null;

  return {
    id: item.id,
    automationType: "recurring" as const,
    donorName: item.donorName,
    donorEmail: item.donorEmail,
    totalAmount: Number(item.amount),
    dailyAmount: Number(item.amount),
    paidAmount: Number(item.totalPaid || 0),
    completedDays: 0,
    totalDays: 0,
    startDate: item.createdAt,
    endDate: next,
    status: item.status,
    currency: item.currency,
    frequency: item.frequency,
    campaign: item.campaign?.title ? { title: item.campaign.title } : undefined,
    nextScheduledDate: next,
    createdAt: item.createdAt,
  };
}
