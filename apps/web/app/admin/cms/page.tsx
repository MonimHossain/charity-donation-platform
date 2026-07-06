import { redirect } from "next/navigation";

export default function CmsIndexPage() {
  redirect("/admin/settings?section=content");
}
