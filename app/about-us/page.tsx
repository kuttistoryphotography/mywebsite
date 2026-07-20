import GlassGallery from "../../components/about-us/GlassPodcastLayout";
import TeamSection from "../../components/about-us/TeamSection";
import PhotographyTestimonial from "../../components/about-us/PhotographyTestimonial";
import AboutTimeline from"../../components/about-us/AboutTimeline";

export const metadata = {
  title: "About Kutti Story Photography | Best Wedding Photographer in Madurai",
  description:
    "Kutti Story Photography is a trusted wedding photography and videography team in Madurai. We specialize in candid wedding photography, cinematic wedding films, pre-wedding shoots, maternity photography, baby shoots, and event photography across Tamil Nadu.",
  keywords: [
    "About Kutti Story Photography",
    "Best Wedding Photographer in Madurai",
    "Wedding Photography Madurai",
    "Candid Wedding Photographer Madurai",
    "Wedding Videography Madurai",
    "Pre Wedding Photography Madurai"
  ],
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
