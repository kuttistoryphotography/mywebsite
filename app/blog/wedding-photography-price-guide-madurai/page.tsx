import Link from "next/link";

export const metadata = {
  title: "Wedding Photography Price Guide in Madurai | Kutti Story Photography",
  description:
    "Wedding photography price guide in Madurai. Learn about photography packages, videography costs, albums and factors affecting wedding photography pricing.",
};

export default function WeddingPhotographyPriceGuidePage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Wedding Photography Price Guide in Madurai
      </h1>

      <p className="mb-6">
        Wedding photography prices in Madurai vary based on coverage hours,
        photographer experience, videography requirements, albums and
        additional services like drone coverage.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Factors That Affect Pricing
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Photography Coverage Hours</li>
        <li>Videography Requirements</li>
        <li>Drone Coverage</li>
        <li>Wedding Albums</li>
        <li>Number of Photographers</li>
        <li>Destination Wedding Travel</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Typical Wedding Photography Services
      </h2>

      <p>
        Most wedding packages include traditional photography, candid
        photography, wedding videography, edited images and digital delivery.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        How to Choose the Right Package
      </h2>

      <p>
        Compare quality, experience, portfolio, customer reviews and
        deliverables instead of choosing only based on price.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        We offer customized wedding photography and videography packages
        designed to match different wedding styles and budgets.
      </p>

      <div className="mt-10">
        <Link
          href="/wedding-photography-and-videography-in-madurai"
          className="text-amber-500 underline"
        >
          View Wedding Packages
        </Link>
      </div>
    </main>
  );
}