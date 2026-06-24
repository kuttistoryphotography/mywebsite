import Link from "next/link";

export const metadata = {
  title: "Wedding Photography and Videography in Madurai | Kutti Story Photography",
  description:
    "Professional wedding photography and videography in Madurai. Candid photography, cinematic wedding films, drone coverage and traditional wedding coverage by Kutti Story Photography.",
};

export default function WeddingPhotographyVideographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Wedding Photography and Videography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography offers complete wedding photography and
        videography services in Madurai. From candid wedding photography
        to cinematic wedding films, we capture every moment of your special day.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Complete Wedding Coverage
      </h2>

      <p>
        Our team provides photography, videography, drone coverage,
        wedding teaser videos, cinematic highlight films and premium
        wedding albums to preserve your memories forever.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Services Included
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Candid Wedding Photography</li>
        <li>Traditional Wedding Photography</li>
        <li>Cinematic Wedding Videography</li>
        <li>Drone Wedding Coverage</li>
        <li>Wedding Teaser Videos</li>
        <li>Wedding Highlight Films</li>
        <li>Pre Wedding Photography</li>
        <li>Engagement Photography</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        We combine storytelling, creativity and professional equipment
        to deliver stunning wedding photographs and cinematic wedding films
        that couples cherish for a lifetime.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        Do you offer both photography and videography packages?
      </h3>

      <p>
        Yes. We provide complete wedding photography and videography
        packages customized to your requirements.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Is drone coverage available?
      </h3>

      <p>
        Yes. Drone coverage is available for weddings, receptions
        and destination weddings.
      </p>

      <div className="flex gap-6 mt-10">
        <Link href="/works" className="text-amber-500 underline">
          View Portfolio
        </Link>

        <Link href="/contact-us" className="text-amber-500 underline">
          Contact Us
        </Link>
      </div>
    </main>
  );
}