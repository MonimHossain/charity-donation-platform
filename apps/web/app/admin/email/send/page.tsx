"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  fetchAdminUsers,
  fetchEmailTemplates,
  previewEmailTemplate,
  sendBulkEmail,
} from "@/lib/api";

interface TemplateOption {
  id: string;
  name: string;
  key: string;
}

interface UserRow {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
}

export default function EmailSendPage() {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState("");
  const [subjectOverride, setSubjectOverride] = useState("");
  const [htmlOverride, setHtmlOverride] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [tplRes, userRes] = await Promise.all([
          fetchEmailTemplates(),
          fetchAdminUsers({ limit: 200 }),
        ]);
        setTemplates(tplRes.items || []);
        setUsers(userRes.items || userRes.data || []);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (!templateId) return;
    void previewEmailTemplate({ templateId }).then((res) => {
      setSubjectOverride(res.subject || "");
      setHtmlOverride(res.html || "");
    });
  }, [templateId]);

  function toggleUser(id: string) {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (!templateId || selectedUsers.size === 0) {
      toast.error("Select a template and at least one user");
      return;
    }
    if (!confirm(`Send email to ${selectedUsers.size} user(s)?`)) return;

    setSending(true);
    try {
      const res = await sendBulkEmail({
        userIds: Array.from(selectedUsers),
        templateId,
        subjectOverride: subjectOverride || undefined,
        htmlOverride: htmlOverride || undefined,
        sendNow: true,
      });
      toast.success(`Sent: ${res.stats?.sent ?? 0}, failed: ${res.stats?.failed ?? 0}`);
    } catch {
      toast.error("Bulk send failed");
    } finally {
      setSending(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const name = (u.fullName || u.name || "").toLowerCase();
    return name.includes(q) || u.email.toLowerCase().includes(q);
  });

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
        <h1 className="text-3xl font-serif font-bold">Send Bulk Email</h1>
        <p className="text-muted-foreground mt-1">Select users and send from a template</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card p-6 space-y-4">
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
                  {t.name} ({t.key})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Subject (editable)</Label>
            <input
              className="rounded-lg border bg-background px-3 py-2 text-sm w-full"
              value={subjectOverride}
              onChange={(e) => setSubjectOverride(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Body (editable)</Label>
            <RichTextEditor value={htmlOverride} onChange={setHtmlOverride} />
          </div>
          <Button onClick={() => void handleSend()} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to {selectedUsers.size} user(s)
          </Button>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Select users ({selectedUsers.size} selected)</Label>
            <input
              placeholder="Search..."
              className="rounded-lg border px-3 py-1.5 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[480px] overflow-y-auto space-y-1">
            {filteredUsers.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.has(u.id)}
                  onChange={() => toggleUser(u.id)}
                />
                <span className="text-sm">
                  {u.fullName || u.name || "Donor"}{" "}
                  <span className="text-muted-foreground">({u.email})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
