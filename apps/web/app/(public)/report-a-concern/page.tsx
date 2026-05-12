"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { submitPublicConcernReport } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ConcernFormData = {
  charityName: string;
  country: string;
  reporterName: string;
  reporterEmail: string;
  concernType: string;
  concernMessage: string;
};

const initialState: ConcernFormData = {
  charityName: "",
  country: "",
  reporterName: "",
  reporterEmail: "",
  concernType: "",
  concernMessage: "",
};

export default function ReportConcernPage() {
  const [formData, setFormData] = useState<ConcernFormData>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitPublicConcernReport({
        charityName: formData.charityName,
        country: formData.country || undefined,
        reporterName: formData.reporterName || undefined,
        reporterEmail: formData.reporterEmail,
        concernType: formData.concernType,
        concernMessage: formData.concernMessage,
      });
      toast.success("Concern report submitted successfully.");
      setFormData(initialState);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit concern report.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Report a Concern
          </p>
          <div className="mt-4 h-0.5 w-12 bg-[var(--lime)]" />
          <h1 className="mt-5 font-serif text-4xl font-bold text-foreground md:text-5xl">
            Submit a Compliance Concern
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Use this form to report concerns regarding a charity&apos;s governance, financial
            conduct, or fundraising claims. All reports are confidential.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border bg-card p-8 shadow-sm"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Charity Name *</Label>
              <Input
                name="charityName"
                required
                value={formData.charityName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                name="reporterName"
                value={formData.reporterName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Your Email *</Label>
              <Input
                name="reporterEmail"
                type="email"
                required
                value={formData.reporterEmail}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Concern Type *</Label>
              <select
                name="concernType"
                required
                value={formData.concernType}
                onChange={handleChange}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a concern type</option>
                <option value="Financial Misconduct">Financial Misconduct</option>
                <option value="Governance Issue">Governance Issue</option>
                <option value="Fundraising Complaint">Fundraising Complaint</option>
                <option value="Compliance Violation">Compliance Violation</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Concern Details *</Label>
            <textarea
              name="concernMessage"
              rows={6}
              required
              value={formData.concernMessage}
              onChange={handleChange}
              disabled={isSubmitting}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Describe the concern in detail..."
            />
          </div>

          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? "Submitting..." : "Submit Concern"}
          </Button>
        </form>
      </section>
    </div>
  );
}
