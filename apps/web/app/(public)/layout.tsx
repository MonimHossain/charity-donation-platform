export const dynamic = "force-dynamic";

import SiteLayout from "@/components/layout/SiteLayout";
import StickyDonationBar from "@/components/home/StickyDonationBar";
import EmergencyBanner from "@/components/home/EmergencyBanner";
// import LiveDonationFeed from "@/components/home/LiveDonationFeed";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EmergencyBanner />
      <SiteLayout>
        {children}
        <StickyDonationBar />
        {/* <LiveDonationFeed /> — hidden for now; re-enable when social proof is ready */}
      </SiteLayout>
    </>
  );
}
