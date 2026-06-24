import Link from "next/link";

export const metadata = {
  title: "Wedding Videography in Madurai | Cinematic Wedding Films",
  description:
    "Professional wedding videography in Madurai by Kutti Story Photography. Cinematic wedding films, highlight videos, teaser videos and traditional wedding videography.",
};

export default function WeddingVideographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Wedding Videography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography provides professional wedding videography in
        Madurai. We create cinematic wedding films that capture emotions,
        traditions and unforgettable moments from your wedding day.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Cinematic Wedding Films
      </h2>

      <p>
        Our wedding videography team specializes in cinematic storytelling,
        highlight films, teaser videos and full wedding coverage. Every film
        is professionally edited with music, color grading and creative
        storytelling.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Our Wedding Videography Services
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Cinematic Wedding Films</li>
        <li>Wedding Teaser Videos</li>
        <li>Wedding Highlight Videos</li>
        <li>Traditional Wedding Videography</li>
        <li>Drone Wedding Coverage</li>
        <li>Reception Videography</li>
        <li>Engagement Videography</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        We use professional cameras, drones and creative editing techniques
        to produce wedding films that couples can cherish forever.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide cinematic wedding videos?
      </h3>

      <p>
        Yes. We specialize in cinematic wedding films, teaser videos and
        highlight videos.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide drone coverage?
      </h3>

      <p>
        Yes. Drone coverage is available for weddings, receptions and
        destination weddings.
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