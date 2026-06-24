import Link from "next/link";

export const metadata = {
  title: "Maternity Photography in Madurai | Kutti Story Photography",
  description:
    "Professional maternity photography in Madurai. Capture the beautiful journey of motherhood with creative maternity photoshoots by Kutti Story Photography.",
};

export default function MaternityPhotographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Maternity Photography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography offers professional maternity photography in
        Madurai, capturing the beauty, joy and emotions of motherhood through
        creative and elegant photoshoots.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Celebrate Your Motherhood Journey
      </h2>

      <p>
        Pregnancy is one of the most special moments in life. Our maternity
        photography sessions are designed to preserve these memories with
        artistic and timeless portraits.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Our Maternity Photography Services
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Indoor Maternity Photoshoots</li>
        <li>Outdoor Maternity Photography</li>
        <li>Couple Maternity Sessions</li>
        <li>Family Maternity Photography</li>
        <li>Creative Theme-Based Shoots</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        When is the best time for a maternity photoshoot?
      </h3>

      <p>
        The ideal time is between 28 and 36 weeks of pregnancy when the baby
        bump is beautifully visible.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide maternity shoot concepts?
      </h3>

      <p>
        Yes. We help with styling, poses, themes and location selection for
        your maternity session.
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