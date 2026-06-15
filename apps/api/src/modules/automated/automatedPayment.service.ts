import type Stripe from "stripe";
import { AppDataSource } from "../../helper/connectDB.js";
import { AutomatedDonationSchedule } from "../../components/automatedDonation/automatedDonation.entity.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { PaymentLog } from "../../components/paymentLog/paymentLog.entity.js";
import { createStripeClient } from "../../helper/stripeClient.js";
import { completeDonation } from "../payments/paymentCompletion.js";

const scheduleRepo = () => AppDataSource.getRepository(AutomatedDonationSchedule);
const donationRepo = () => AppDataSource.getRepository(Donation);
const paymentLogRepo = () => AppDataSource.getRepository(PaymentLog);

const getStripe = () => createStripeClient(process.env.STRIPE_SECRET_KEY!);

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateReceiptNumber(): string {
  const date = new Date();
  const prefix = `DON-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

export async function activateAutomatedSchedulePaymentMethod(
  scheduleId: string,
  stripeCustomerId: string,
  stripePaymentMethodId: string
): Promise<AutomatedDonationSchedule | null> {
  const schedule = await scheduleRepo().findOne({ where: { id: scheduleId } });
  if (!schedule) return null;

  schedule.stripeCustomerId = stripeCustomerId;
  schedule.stripePaymentMethodId = stripePaymentMethodId;
  if (schedule.status === "scheduled" || schedule.status === "awaiting_payment_method") {
    schedule.status = "active";
  }
  await scheduleRepo().save(schedule);
  return schedule;
}

export async function markRamadanInstallmentsPaid(
  scheduleId: string,
  paidAmount: number,
  paidThroughDate = todayIsoDate()
): Promise<void> {
  const schedule = await scheduleRepo().findOne({ where: { id: scheduleId } });
  if (!schedule?.installments?.length) return;

  let remaining = Math.round(paidAmount * 100) / 100;
  let completed = 0;
  let paidTotal = Number(schedule.paidAmount || 0);

  const installments = schedule.installments.map((inst) => {
    if (remaining <= 0 || inst.status === "paid") return inst;
    if (inst.scheduledDate > paidThroughDate) return inst;
    const amount = Math.round(Number(inst.amount) * 100) / 100;
    if (remaining + 0.01 < amount) return inst;
    remaining = Math.round((remaining - amount) * 100) / 100;
    completed += 1;
    paidTotal += amount;
    return { ...inst, status: "paid" };
  });

  schedule.installments = installments;
  schedule.completedDays = (schedule.completedDays || 0) + completed;
  schedule.paidAmount = paidTotal;
  if (installments.every((inst) => inst.status === "paid")) {
    schedule.status = "completed";
  }
  await scheduleRepo().save(schedule);
}

async function chargeInstallment(
  schedule: AutomatedDonationSchedule,
  installment: NonNullable<AutomatedDonationSchedule["installments"]>[number]
): Promise<boolean> {
  if (!schedule.stripeCustomerId || !schedule.stripePaymentMethodId) return false;

  const stripe = getStripe();
  const amount = Math.round(Number(installment.amount) * 100) / 100;
  if (amount <= 0) return false;

  const donation = donationRepo().create({
    amount,
    currency: installment.currency || schedule.currency || "GBP",
    frequency: "ramadan_split",
    campaignId: schedule.campaignId,
    userId: schedule.userId,
    donorName: schedule.donorName,
    donorEmail: schedule.donorEmail,
    giftAid: schedule.giftAid || false,
    giftAidAmount: schedule.giftAid && schedule.currency === "GBP" ? +(amount * 0.25).toFixed(2) : 0,
    totalAmount:
      amount +
      (schedule.giftAid && schedule.currency === "GBP" ? +(amount * 0.25).toFixed(2) : 0),
    donationType: "ramadan",
    paymentMethod: schedule.paymentMethod || "stripe",
    automatedScheduleId: schedule.id,
    message: `Ramadan split installment — ${installment.scheduledDate}`,
    receiptNumber: generateReceiptNumber(),
    status: "pending",
  });
  await donationRepo().save(donation);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: (installment.currency || schedule.currency || "GBP").toLowerCase(),
      customer: schedule.stripeCustomerId,
      payment_method: schedule.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      payment_method_types: ["card"],
      description: `Ramadan split — ${installment.scheduledDate}`,
      metadata: {
        donationId: donation.id,
        automatedScheduleId: schedule.id,
        installmentId: installment.id,
        scheduledDate: installment.scheduledDate,
      },
    });

    if (paymentIntent.status === "succeeded") {
      donation.stripePaymentIntentId = paymentIntent.id;
      await donationRepo().save(donation);
      await completeDonation(donation.id);
      await paymentLogRepo().save(
        paymentLogRepo().create({
          donationId: donation.id,
          type: "charge",
          provider: "stripe",
          providerTransactionId: paymentIntent.id,
          amount,
          currency: installment.currency || schedule.currency || "GBP",
          status: "succeeded",
        })
      );
      return true;
    }

    donation.status = "failed";
    await donationRepo().save(donation);
    return false;
  } catch (error) {
    console.error("[automated] installment charge failed:", error);
    donation.status = "failed";
    await donationRepo().save(donation);
    return false;
  }
}

export async function processDueAutomatedInstallments(): Promise<number> {
  const today = todayIsoDate();
  const schedules = await scheduleRepo().find({
    where: [{ status: "active" }, { status: "scheduled" }],
  });

  let charged = 0;
  for (const schedule of schedules) {
    if (!schedule.installments?.length || !schedule.stripePaymentMethodId) continue;

    let changed = false;
    const installments = [...schedule.installments];

    for (let i = 0; i < installments.length; i++) {
      const inst = installments[i];
      if (inst.status !== "pending" || inst.scheduledDate !== today) continue;

      const ok = await chargeInstallment(schedule, inst);
      if (ok) {
        installments[i] = { ...inst, status: "paid" };
        schedule.completedDays = (schedule.completedDays || 0) + 1;
        schedule.paidAmount = Math.round((Number(schedule.paidAmount || 0) + Number(inst.amount)) * 100) / 100;
        charged += 1;
        changed = true;
      } else {
        installments[i] = { ...inst, status: "failed" };
        changed = true;
      }
    }

    if (changed) {
      schedule.installments = installments;
      if (installments.every((inst) => inst.status === "paid")) {
        schedule.status = "completed";
      }
      await scheduleRepo().save(schedule);
    }
  }

  return charged;
}

export function startAutomatedPaymentWorker(): void {
  const intervalMs = Number(process.env.AUTOMATED_PAYMENT_INTERVAL_MS || 60 * 60 * 1000);
  const run = () => {
    void processDueAutomatedInstallments().catch((err) => {
      console.error("[automated] worker error:", err);
    });
  };
  run();
  setInterval(run, intervalMs);
  console.log(`Automated installment worker started (every ${intervalMs}ms)`);
}

export async function getScheduleDueAmountThroughToday(scheduleId: string): Promise<number> {
  const schedule = await scheduleRepo().findOne({ where: { id: scheduleId } });
  if (!schedule?.installments?.length) return 0;
  const today = todayIsoDate();
  return schedule.installments
    .filter((inst) => inst.status === "pending" && inst.scheduledDate <= today)
    .reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
}

export async function markFirstInstallmentPaid(scheduleId: string): Promise<void> {
  const schedule = await scheduleRepo().findOne({ where: { id: scheduleId } });
  if (!schedule?.installments?.length) return;

  const sorted = [...schedule.installments].sort((a, b) =>
    a.scheduledDate.localeCompare(b.scheduledDate)
  );
  const firstPending = sorted.find((inst) => inst.status === "pending");
  if (!firstPending) return;

  const amount = Math.round(Number(firstPending.amount) * 100) / 100;
  schedule.installments = schedule.installments.map((inst) =>
    inst.id === firstPending.id ? { ...inst, status: "paid" } : inst
  );
  schedule.completedDays = (schedule.completedDays || 0) + 1;
  schedule.paidAmount = Math.round((Number(schedule.paidAmount || 0) + amount) * 100) / 100;
  if (schedule.installments.every((inst) => inst.status === "paid")) {
    schedule.status = "completed";
  } else if (schedule.status === "awaiting_payment_method") {
    schedule.status = "active";
  }
  await scheduleRepo().save(schedule);
}

export async function activateSchedulesFromStripePayment(
  scheduleIds: string[],
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const { customerId, paymentMethodId } = await extractStripePaymentMethod(paymentIntent);
  if (!customerId || !paymentMethodId) return;

  for (const scheduleId of scheduleIds) {
    await activateAutomatedSchedulePaymentMethod(scheduleId, customerId, paymentMethodId);
    if (paymentIntent.amount > 0) {
      await markFirstInstallmentPaid(scheduleId);
    }
  }
}

export async function activateSchedulesFromStripeSetup(
  scheduleIds: string[],
  customerId: string,
  paymentMethodId: string
): Promise<void> {
  for (const scheduleId of scheduleIds) {
    await activateAutomatedSchedulePaymentMethod(scheduleId, customerId, paymentMethodId);
  }
}

export async function extractStripePaymentMethod(
  paymentIntent: Stripe.PaymentIntent
): Promise<{ customerId?: string; paymentMethodId?: string }> {
  const customerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;
  const paymentMethodId =
    typeof paymentIntent.payment_method === "string"
      ? paymentIntent.payment_method
      : paymentIntent.payment_method?.id;
  return { customerId, paymentMethodId };
}
