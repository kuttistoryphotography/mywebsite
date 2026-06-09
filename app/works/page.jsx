import GroupPortfolio from "@/components/works/groupWork";

export const metadata = {
  title: "Our Works | Kutti Story Photography Portfolio",
  description: "Explore our stunning collection of wedding photography, pre-wedding shoots, outdoor portraits, baby shoots, product photography, and corporate event coverage. Professional photography services in Chennai.",
  keywords: ["wedding photography", "pre-wedding shoot", "portrait photography", "baby photography", "product photography", "corporate photography", "Chennai photographer", "photography portfolio"],
  openGraph: {
    title: "Our Works | Kutti Story Photography Portfolio",
    description: "Explore our stunning collection of wedding photography, pre-wedding shoots, outdoor portraits, and more.",
    type: "website",
  },
};

export default function WorksPage() {
  return (
    <main>
      <GroupPortfolio />
    </main>
  );
}
