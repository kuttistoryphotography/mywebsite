import Link from "next/link";

export const metadata = {
  title: "Event Photography in Madurai | Kutti Story Photography",
  description:
    "Professional event photography in Madurai for school events, corporate events, annual day functions, cultural programs and celebrations.",
};

export default function EventPhotographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Event Photography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography provides professional event photography in
        Madurai for schools, colleges, businesses and private celebrations.
        We capture every important moment with creativity and precision.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Our Event Photography Services
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>School Annual Day Photography</li>
        <li>Investiture Ceremony Photography</li>
        <li>Corporate Event Photography</li>
        <li>College Event Photography</li>
        <li>Cultural Program Photography</li>
        <li>Award Function Photography</li>
        <li>Conference Photography</li>
        <li>Product Launch Events</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        We use professional cameras and creative techniques to document
        every important moment, ensuring high-quality photographs that
        tell the complete story of your event.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Event Videography Services
      </h2>

      <p>
        Along with photography, we provide professional videography,
        highlight videos, promotional videos and social media reels
        for events and organizations.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        Do you cover school events?
      </h3>

      <p>
        Yes. We regularly cover annual day functions, sports day,
        graduation ceremonies and school celebrations.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide videography for events?
      </h3>

      <p>
        Yes. We provide both photography and videography services
        for events of all sizes.
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