"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmailCampaign, fetchEmailCampaigns, fetchEmailTemplates } from "@/lib/api";

type CampaignType = "newsletter" | "annual_summary" | "admin_alert";

export default function EmailCampaignsPage() {
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; key: string }>>([]);
  const [campaigns, setCampaigns] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [type, setType] = useState<CampaignType>("newsletter");
  const [templateId, setTemplateId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertBody, setAlertBody] = useState("");

  async function load() {
    try {
      const [tplRes, campRes] = await Promise.all([
        fetchEmailTemplates(),
        fetchEmailCampaigns(),
      ]);
      setTemplates(tplRes.items || []);
      setCampaigns(campRes.items || []);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSend() {
    if (!templateId) {
      toast.error("Select a template");
      return;
    }
    setSending(true);
    try {
      const config: Record<string, unknown> = {};
      if (type === "annual_summary") {
        if (!fromDate || !toDate) {
          toast.error("Date range required");
          setSending(false);
          return;
        }
        config.fromDate = fromDate;
        config.toDate = toDate;
      }
      if (type === "admin_alert") {
        config.title = alertTitle || "Admin alert";
        config.body = alertBody;
      }

      const res = await createEmailCampaign({
        type,
        templateId,
        name: `${type} campaign`,
        sendNow: true,
        config,
      });
      toast.success(`Campaign sent — sent: ${res.stats?.sent ?? 0}`);
      await load();
    } catch {
      toast.error("Campaign failed");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Email Campaigns</h1>
        <p className="text-muted-foreground mt-1">Newsletter, annual summaries, and admin alerts</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4 max-w-xl">
        <div className="grid gap-2">
          <Label>Campaign type</Label>
          <select
            className="rounded-lg border bg-background px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as CampaignType)}
          >
            <option value="newsletter">Monthly newsletter (subscribers)</option>
            <option value="annual_summary">Annual donation summary</option>
            <option value="admin_alert">Admin alert (email + notification)</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label>Template</Label>
          <select
            className="rounded-lg border bg-background px-3 py-2 text-sm"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">Select template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {type === "annual_summary" && (
          <>
            <div className="grid gap-2">
              <Label>From date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>To date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </>
        )}

        {type === "admin_alert" && (
          <>
            <div className="grid gap-2">
              <Label>Alert title</Label>
              <Input value={alertTitle} onChange={(e) => setAlertTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Alert body</Label>
              <textarea
                className="rounded-lg border bg-background px-3 py-2 text-sm min-h-[100px] w-full"
                value={alertBody}
                onChange={(e) => setAlertBody(e.target.value)}
              />
            </div>
          </>
        )}

        <Button onClick={() => void handleSend()} disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
          Send now
        </Button>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Sent</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={String(c.id)} className="border-b">
                <td className="px-4 py-3">{String(c.type)}</td>
                <td className="px-4 py-3">{String(c.status)}</td>
                <td className="px-4 py-3">
                  {String((c.stats as { sent?: number })?.sent ?? 0)}
                </td>
                <td className="px-4 py-3">
                  {c.completedAt
                    ? new Date(String(c.completedAt)).toLocaleString()
                    : c.createdAt
                      ? new Date(String(c.createdAt)).toLocaleString()
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
