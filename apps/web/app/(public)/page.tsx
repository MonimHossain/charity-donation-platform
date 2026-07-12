import Hero from "@/components/home/Hero";
import TrustBadges from "@/components/home/TrustBadges";
import ImpactStats from "@/components/home/ImpactStats";
import FeaturedCampaigns from "@/components/home/FeaturedCampaigns";
import Fundraisers from "@/components/home/Fundraisers";
import Testimonials from "@/components/home/Testimonials";
import StorySection from "@/components/home/StorySection";
import Quote from "@/components/home/Quote";
import ZakatResources from "@/components/home/ZakatResources";
import Stories from "@/components/home/Stories";
import Newsletter from "@/components/home/Newsletter";
import FAQ from "@/components/home/FAQ";
import CTA from "@/components/home/CTA";
import { buildHomepageFaqSchemaScripts } from "@/lib/server/cms-faqs";

export default async function HomePage() {
  const schemaScripts = await buildHomepageFaqSchemaScripts();

  return (
    <>
      {schemaScripts.map((schema, index) => (
        <script
          key={`home-faq-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
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
