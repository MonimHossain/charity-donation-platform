import { api } from "@/lib/api";

export interface UploadedMediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export type MediaAccept = "image" | "video" | "document" | "all";

export function mediaAcceptAttribute(accept: MediaAccept): string | undefined {
  if (accept === "image") return "image/*";
  if (accept === "video") return "video/*";
  return undefined;
}

export function matchesMediaAccept(file: File, accept: MediaAccept): boolean {
  if (accept === "all") return true;
  if (accept === "image") return file.type.startsWith("image/");
  if (accept === "video") return file.type.startsWith("video/");
  return !file.type.startsWith("image/") && !file.type.startsWith("video/");
}

export async function uploadMediaFile(file: File): Promise<UploadedMediaFile> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/admin/cms/media/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return {
    id: data.id,
    name: data.name,
    url: data.url,
    type: data.type,
    size: data.size,
  };
}
