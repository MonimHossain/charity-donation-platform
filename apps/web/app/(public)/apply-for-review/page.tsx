"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { submitPublicApplyReview } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = {
  organisationName: string;
  country: string;
  websiteUrl: string;
  registrationNumber: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
};

const initialState: FormData = {
  organisationName: "",
  country: "",
  websiteUrl: "",
  registrationNumber: "",
  contactName: "",
  email: "",
  phone: "",
  message: "",
};

export default function ApplyForReviewPage() {
  const [formData, setFormData] = useState<FormData>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitPublicApplyReview({
        organisationName: formData.organisationName,
        country: formData.country || undefined,
        websiteUrl: formData.websiteUrl || undefined,
        registrationNumber: formData.registrationNumber || undefined,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message || undefined,
      });
      toast.success("Application submitted successfully.");
      setFormData(initialState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit application.";
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
            Apply for Review
          </p>
          <div className="mt-4 h-0.5 w-12 bg-[var(--lime)]" />
          <h1 className="mt-5 font-serif text-4xl font-bold text-foreground md:text-5xl">
            Submit Your Organisation for Audit
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Complete the form below to submit your organisation&apos;s application for
            certification review. We will assess the submission and contact your designated
            representative with next steps.
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
              <Label>Organisation Name *</Label>
              <Input name="organisationName" required value={formData.organisationName} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input name="country" value={formData.country} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label>Contact Name *</Label>
              <Input name="contactName" required value={formData.contactName} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label>Contact Email *</Label>
              <Input name="email" type="email" required value={formData.email} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Phone Number</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} disabled={isSubmitting} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Information</Label>
            <textarea
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              disabled={isSubmitting}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Tell us about your organisation and the scope of your work..."
            />
          </div>

          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </section>
    </div>
  );
}
