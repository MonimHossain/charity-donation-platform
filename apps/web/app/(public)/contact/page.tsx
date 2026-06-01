"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2 } from "lucide-react";
import { submitPublicContactMessage } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";
import { toast } from "sonner";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!USE_MOCK_DATA) {
        await submitPublicContactMessage(form);
      }
      setSubmitted(true);
      toast.success("Message sent successfully");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="gradient-hero py-16 lg:py-24">
        <div className="container-wide text-center">
          <span className="text-xs uppercase tracking-widest font-bold text-primary">Contact Us</span>
          <h1 className="mt-3 font-serif text-4xl lg:text-5xl text-foreground">Get in Touch</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a question about our campaigns or want to get involved? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="container-wide py-16 lg:py-20 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          {submitted ? (
            <div className="rounded-3xl bg-card border border-border p-12 text-center shadow-soft">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
              <h2 className="mt-4 font-serif text-2xl text-foreground">Message Sent!</h2>
              <p className="mt-2 text-muted-foreground">Thank you for reaching out. We&apos;ll get back to you within 24-48 hours.</p>
              <Button onClick={() => setSubmitted(false)} className="mt-6 rounded-full">Send Another Message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft space-y-5">
              <h2 className="font-serif text-2xl text-foreground">Send us a message</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-12 rounded-xl" placeholder="John Smith" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-12 rounded-xl" placeholder="you@email.com" />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1 h-12 rounded-xl" placeholder="How can we help?" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Tell us more..."
                />
              </div>
              <Button type="submit" size="lg" className="rounded-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? "Sending…" : "Send Message"}
              </Button>
            </form>
          )}
        </div>

        <aside className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
            <h3 className="font-serif text-xl font-semibold text-foreground mb-4">Contact Information</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Phone</p>
                  <a href="tel:03335330642" className="text-muted-foreground hover:text-primary">0333 533 0642</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Email</p>
                  <a href="mailto:info@charityplatform.org" className="text-muted-foreground hover:text-primary">info@charityplatform.org</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Address</p>
                  <p className="text-muted-foreground">123 Charity Lane, London, EC1A 1BB, UK</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="rounded-3xl gradient-plum text-primary-foreground p-6">
            <p className="text-xs uppercase tracking-widest text-accent font-semibold">Office Hours</p>
            <p className="mt-2 text-sm text-primary-foreground/90">Monday — Friday: 9:00 AM — 5:00 PM</p>
            <p className="text-sm text-primary-foreground/90">Saturday: 10:00 AM — 2:00 PM</p>
            <p className="text-sm text-primary-foreground/90">Sunday: Closed</p>
          </div>
        </aside>
      </section>
    </>
  );
}
