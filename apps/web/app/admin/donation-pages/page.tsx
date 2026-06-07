import { redirect } from "next/navigation";

export default function DonationPagesRedirect() {
  redirect("/admin/campaigns");
}
