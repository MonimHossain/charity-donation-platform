import Hero from "@/components/home/Hero";
import TrustBadges from "@/components/home/TrustBadges";
import FeaturedCampaigns from "@/components/home/FeaturedCampaigns";
import Fundraisers from "@/components/home/Fundraisers";
import ImpactStats from "@/components/home/ImpactStats";
import Testimonials from "@/components/home/Testimonials";
import StorySection from "@/components/home/StorySection";
import Quote from "@/components/home/Quote";
import ZakatResources from "@/components/home/ZakatResources";
import Stories from "@/components/home/Stories";
import Newsletter from "@/components/home/Newsletter";
import FAQ from "@/components/home/FAQ";
import CTA from "@/components/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBadges />
      <FeaturedCampaigns />
      <Fundraisers />
      <ImpactStats />
      <Testimonials />
      <StorySection />
      <Quote />
      <ZakatResources />
      <Stories />
      <Newsletter />
      <FAQ />
      <CTA />
    </>
  );
}
