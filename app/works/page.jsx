import GroupPortfolio from "@/components/works/groupWork";

export const metadata = {
  title: "Our Works | Kutti Story Photography Portfolio",
  description:
  "Explore our wedding photography portfolio featuring candid weddings, pre-wedding shoots, engagements, maternity sessions, baby showers, and event photography across Madurai, Tamil Nadu, and Kerala.",
  keywords: [
  "Wedding Photography",
  "Candid Wedding Photography",
  "Wedding Photographer Madurai",
  "Wedding Photographer Tamil Nadu",
  "Wedding Photographer Kerala",
  "Pre Wedding Photography",
  "Engagement Photography",
  "Maternity Photography",
  "Baby Shower Photography",
  "Portrait Photography",
  "Wedding Videography",
  "Photography Portfolio",
  "Kutti Story Photography",
],
  openGraph: {
    title: "Our Works | Kutti Story Photography Portfolio",
    description:
      "Explore our stunning collection of wedding photography, pre-wedding shoots, outdoor portraits, and more.",
    type: "website",
  },
};

export default function WorksPage() {
  return (
    <main>
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Our Photography Portfolio
        </h1>

        <p className="text-lg text-gray-600 leading-8 mb-6">
          Welcome to the Kutti Story Photography portfolio. Explore our collection of
          wedding photography, candid wedding moments, engagement sessions,
          pre-wedding shoots, maternity photography, baby showers, birthday
          celebrations, and cinematic event coverage captured across Madurai,
          Tamil Nadu, Kerala, and destination wedding locations.
        </p>

        <p className="text-lg text-gray-600 leading-8 mb-6">
          Every gallery reflects our passion for storytelling through natural
          emotions, creative compositions, and cinematic editing. We focus on
          preserving genuine memories that families can cherish for generations.
        </p>

        <p className="text-lg text-gray-600 leading-8">
          Browse our recent projects below to explore different photography
          styles, beautiful wedding venues, outdoor locations, and cinematic
          storytelling. We proudly capture weddings and events throughout
          Madurai, Tamil Nadu, Kerala, and nearby destinations, creating timeless
          memories for every couple and family.
        </p>
      </section>

      <GroupPortfolio />
    </main>
  );
}