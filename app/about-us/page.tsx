import GlassGallery from "../../components/about-us/GlassPodcastLayout";
import TeamSection from "../../components/about-us/TeamSection";
import PhotographyTestimonial from "../../components/about-us/PhotographyTestimonial";
import AboutTimeline from"../../components/about-us/AboutTimeline";

export const metadata = {
  title: "about us",
  description: "Browse our FAQ section for quick answers to common questions about our services, features, pricing, and support.",
};


export default function AboutUsPage() {
  return (
    <>

     <GlassGallery />
     <TeamSection />
      <PhotographyTestimonial />
      <AboutTimeline />

    </>
  );
}
