"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  fetchEmailTemplates,
  updateEmailTemplate,
} from "@/lib/api";

interface EmailTemplateRow {
  id: string;
  key: string;
  name: string;
  category: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  mergeTags: string[];
  isSystem: boolean;
  isActive: boolean;
}

const MERGE_TAG_HINTS = [
  "{{donorName}}",
  "{{donorEmail}}",
  "{{amount}}",
  "{{totalAmount}}",
  "{{receiptNumber}}",
  "{{campaignTitle}}",
  "{{annualTotal}}",
  "{{donationCount}}",
  "{{dateRange}}",
  "{{chargeDate}}",
  "{{alertTitle}}",
  "{{alertBody}}",
  "{{appUrl}}",
];

export default function EmailTemplatesPage() {
  const [items, setItems] = useState<EmailTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "editor">("list");
  const [editing, setEditing] = useState<EmailTemplateRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    key: "",
    name: "",
    category: "transactional",
    subject: "",
    preheader: "",
    htmlBody: "",
    isActive: true,
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetchEmailTemplates();
      setItems(res.items || []);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({
      key: "",
      name: "",
      category: "transactional",
      subject: "",
      preheader: "",
      htmlBody: "<p>Hello {{donorName}},</p>",
      isActive: true,
    });
    setView("editor");
  }

  function openEdit(tpl: EmailTemplateRow) {
    setEditing(tpl);
    setForm({
      key: tpl.key,
      name: tpl.name,
      category: tpl.category,
      subject: tpl.subject,
      preheader: tpl.preheader || "",
      htmlBody: tpl.htmlBody,
      isActive: tpl.isActive,
    });
    setView("editor");
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await updateEmailTemplate(editing.id, {
          name: form.name,
          category: form.category,
          subject: form.subject,
          preheader: form.preheader,
          htmlBody: form.htmlBody,
          isActive: form.isActive,
        });
        toast.success("Template updated");
      } else {
        await createEmailTemplate(form);
        toast.success("Template created");
      }
      setView("list");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tpl: EmailTemplateRow) {
    if (tpl.isSystem) {
      toast.error("System templates cannot be deleted");
      return;
    }
    if (!confirm(`Delete template "${tpl.name}"?`)) return;
    try {
      await deleteEmailTemplate(tpl.id);
      toast.success("Template deleted");
      await load();
    } catch {
      toast.error("Delete failed");
    }
  }

  if (view === "editor") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-serif font-bold">
            {editing ? "Edit template" : "New template"}
          </h1>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-4">
          {!editing && (
            <div className="grid gap-2">
              <Label>Key (slug)</Label>
              <Input
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                placeholder="my_custom_template"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Preheader</Label>
            <Input
              value={form.preheader}
              onChange={(e) => setForm((f) => ({ ...f, preheader: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Body</Label>
            <RichTextEditor
              value={form.htmlBody}
              onChange={(html) => setForm((f) => ({ ...f, htmlBody: html }))}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Merge tags (click to copy idea):</p>
            <div className="flex flex-wrap gap-2">
              {MERGE_TAG_HINTS.map((tag) => (
                <code key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                  {tag}
                </code>
              ))}
            </div>
          </div>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save template"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-1">Manage transactional and marketing email templates</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New template
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Key</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tpl) => (
                <tr key={tpl.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{tpl.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{tpl.key}</td>
                  <td className="px-4 py-3 capitalize">{tpl.category}</td>
                  <td className="px-4 py-3 truncate max-w-[200px]">{tpl.subject}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(tpl)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!tpl.isSystem && (
                      <Button variant="ghost" size="sm" onClick={() => void handleDelete(tpl)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
