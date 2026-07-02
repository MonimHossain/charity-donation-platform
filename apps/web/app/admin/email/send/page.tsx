"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import type { DonorSegmentParams } from "@repo/shared-types";
import { DONOR_SEGMENT_LABELS } from "@repo/shared-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/admin/RichTextEditor";
import DonorAudienceFilter, {
  segmentParamsToQuery,
} from "@/components/admin/DonorAudienceFilter";
import {
  fetchAdminUsers,
  fetchDonorSegmentAllIds,
  fetchDonorSegmentUsers,
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

const PAGE_SIZE = 50;

export default function EmailSendPage() {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [segment, setSegment] = useState<DonorSegmentParams | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [subjectOverride, setSubjectOverride] = useState("");
  const [htmlOverride, setHtmlOverride] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    void fetchEmailTemplates()
      .then((tplRes) => setTemplates(tplRes.items || []))
      .catch(() => toast.error("Failed to load templates"))
      .finally(() => setLoading(false));
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      if (segment) {
        if (segment.segment === "campaign" && !segment.campaignId) {
          setUsers([]);
          setTotalUsers(0);
          return;
        }
        const res = await fetchDonorSegmentUsers({
          ...segmentParamsToQuery(segment),
          page: String(page),
          limit: String(PAGE_SIZE),
          search: search.trim() || undefined,
        });
        setUsers(res.items || []);
        setTotalUsers(res.total || 0);
      } else {
        const res = await fetchAdminUsers({
          limit: PAGE_SIZE,
          page,
          search: search.trim() || undefined,
        });
        setUsers(res.items || res.data || []);
        setTotalUsers(res.total || 0);
      }
    } catch {
      toast.error("Failed to load users");
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setUsersLoading(false);
    }
  }, [segment, page, search]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
    setSelectedUsers(new Set());
  }, [segment, search]);

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

  async function handleSelectAllInAudience() {
    if (segment && segment.segment === "campaign" && !segment.campaignId) {
      toast.error("Select a campaign first");
      return;
    }
    setSelectingAll(true);
    try {
      let ids: string[];
      if (segment) {
        const res = await fetchDonorSegmentAllIds(segmentParamsToQuery(segment));
        ids = res.ids || [];
      } else {
        const res = await fetchAdminUsers({ limit: 5000, page: 1 });
        ids = (res.items || res.data || []).map((u: UserRow) => u.id);
      }
      setSelectedUsers(new Set(ids));
      toast.success(`Selected ${ids.length} user(s)`);
    } catch {
      toast.error("Could not select all users");
    } finally {
      setSelectingAll(false);
    }
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

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const segmentLabel = segment ? DONOR_SEGMENT_LABELS[segment.segment] : null;

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
          <DonorAudienceFilter value={segment} onChange={setSegment} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>
              {segmentLabel ? `${segmentLabel} — ` : ""}
              {selectedUsers.size} selected of {totalUsers}
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectingAll || usersLoading}
                onClick={() => void handleSelectAllInAudience()}
              >
                {selectingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Select all"}
              </Button>
              <input
                placeholder="Search..."
                className="rounded-lg border px-3 py-1.5 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No users match this audience.
              </p>
            ) : (
              users.map((u) => (
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
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || usersLoading}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || usersLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
