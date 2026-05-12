"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

interface FooterLink {
  label: string;
  url: string;
}

interface FooterData {
  aboutText: string;
  copyrightText: string;
  columns: { title: string; links: FooterLink[] }[];
  contactInfo: {
    address: string;
    phone: string;
    email: string;
  };
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
    linkedin: string;
  };
}

const defaultData: FooterData = {
  aboutText: "",
  copyrightText: "",
  columns: [
    { title: "Quick Links", links: [{ label: "", url: "" }] },
  ],
  contactInfo: { address: "", phone: "", email: "" },
  socialMedia: { facebook: "", twitter: "", instagram: "", youtube: "", linkedin: "" },
};

export default function FooterPage() {
  const [data, setData] = useState<FooterData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/admin/cms/footer");
        if (res.data) {
          setData({ ...defaultData, ...res.data });
        }
      } catch {
        toast.error("Failed to load footer settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/admin/cms/footer", data);
      toast.success("Footer settings saved");
    } catch {
      toast.error("Failed to save footer settings");
    } finally {
      setSaving(false);
    }
  }

  function addColumn() {
    setData({
      ...data,
      columns: [...data.columns, { title: "", links: [{ label: "", url: "" }] }],
    });
  }

  function removeColumn(idx: number) {
    setData({
      ...data,
      columns: data.columns.filter((_, i) => i !== idx),
    });
  }

  function updateColumn(idx: number, title: string) {
    const cols = [...data.columns];
    cols[idx] = { ...cols[idx], title };
    setData({ ...data, columns: cols });
  }

  function addLink(colIdx: number) {
    const cols = [...data.columns];
    cols[colIdx] = { ...cols[colIdx], links: [...cols[colIdx].links, { label: "", url: "" }] };
    setData({ ...data, columns: cols });
  }

  function removeLink(colIdx: number, linkIdx: number) {
    const cols = [...data.columns];
    cols[colIdx] = { ...cols[colIdx], links: cols[colIdx].links.filter((_, i) => i !== linkIdx) };
    setData({ ...data, columns: cols });
  }

  function updateLink(colIdx: number, linkIdx: number, field: "label" | "url", value: string) {
    const cols = [...data.columns];
    const links = [...cols[colIdx].links];
    links[linkIdx] = { ...links[linkIdx], [field]: value };
    cols[colIdx] = { ...cols[colIdx], links };
    setData({ ...data, columns: cols });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading footer settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Footer Management</h1>
          <p className="text-muted-foreground mt-1">Edit the site footer content and links</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
        <h2 className="text-lg font-serif font-bold">About Section</h2>
        <div className="space-y-2">
          <Label>About Text</Label>
          <textarea rows={3} value={data.aboutText} onChange={(e) => setData({ ...data, aboutText: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div className="space-y-2">
          <Label>Copyright Text</Label>
          <Input value={data.copyrightText} onChange={(e) => setData({ ...data, copyrightText: e.target.value })} placeholder="© 2026 Charity Name. All rights reserved." />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold">Footer Columns</h2>
          <Button variant="outline" size="sm" onClick={addColumn}>
            <Plus className="h-4 w-4" /> Add Column
          </Button>
        </div>
        {data.columns.map((col, colIdx) => (
          <div key={colIdx} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Input
                value={col.title}
                onChange={(e) => updateColumn(colIdx, e.target.value)}
                placeholder="Column Title"
                className="font-medium"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeColumn(colIdx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {col.links.map((link, linkIdx) => (
                <div key={linkIdx} className="flex items-center gap-2">
                  <Input value={link.label} onChange={(e) => updateLink(colIdx, linkIdx, "label", e.target.value)} placeholder="Label" className="flex-1" />
                  <Input value={link.url} onChange={(e) => updateLink(colIdx, linkIdx, "url", e.target.value)} placeholder="/url" className="flex-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeLink(colIdx, linkIdx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addLink(colIdx)}>
                <Plus className="h-3.5 w-3.5" /> Add Link
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
        <h2 className="text-lg font-serif font-bold">Contact Information</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={data.contactInfo.address} onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, address: e.target.value } })} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={data.contactInfo.phone} onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, phone: e.target.value } })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={data.contactInfo.email} onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, email: e.target.value } })} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
        <h2 className="text-lg font-serif font-bold">Social Media</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(data.socialMedia) as Array<keyof typeof data.socialMedia>).map((key) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key}</Label>
              <Input
                value={data.socialMedia[key]}
                onChange={(e) => setData({ ...data, socialMedia: { ...data.socialMedia, [key]: e.target.value } })}
                placeholder={`https://${key}.com/...`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
