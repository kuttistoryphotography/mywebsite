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
      <section className="max-w-6xl mx-auto px-6 py-20">

      <h1 className="text-4xl md:text-5xl font-bold mb-8">
      Wedding Photography Portfolio – Kutti Story Photography
      </h1>

      <p className="text-lg text-gray-600 leading-8 mb-6">
      Welcome to the official portfolio of Kutti Story Photography. Our work showcases real weddings, candid photography, cinematic wedding films, engagement sessions, pre-wedding shoots, maternity photography, baby showers, birthday celebrations, family portraits, and corporate events captured across Madurai, Tamil Nadu, Kerala, and destination wedding locations.
      </p>

      <p className="text-lg text-gray-600 leading-8 mb-6">
      Every wedding has its own emotions, traditions, and unforgettable moments. Our goal is to preserve those memories with natural storytelling, artistic compositions, creative lighting, and premium colour grading. We believe photography should tell a story that remains beautiful for generations.
      </p>

      <h2 className="text-3xl font-semibold mt-12 mb-5">
      Photography Services We Cover
      </h2>

      <p className="text-lg text-gray-600 leading-8 mb-6">
      Our portfolio includes traditional Tamil weddings, Christian weddings, Muslim weddings, destination weddings, engagement ceremonies, pre-wedding shoots, post-wedding sessions, maternity photography, newborn photography, baby shower photography, birthday events, corporate photography, and commercial projects throughout South India.
      </p>

      <h2 className="text-3xl font-semibold mt-12 mb-5">
      Serving Tamil Nadu & Kerala
      </h2>

      <p className="text-lg text-gray-600 leading-8">
      Kutti Story Photography proudly serves clients across Madurai, Chennai, Coimbatore, Trichy, Salem, Tirunelveli, Dindigul, Theni, Kanyakumari, Kochi, Thrissur, Palakkad, Trivandrum, and other locations throughout Tamil Nadu and Kerala. We also travel for destination weddings anywhere in India.
      </p>

      </section>


      <GroupPortfolio />
    </main>
  );
}