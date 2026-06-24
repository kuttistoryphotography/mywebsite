import Link from "next/link";

export const metadata = {
  title: "Baby Shoot Photography in Madurai | Kutti Story Photography",
  description:
    "Professional baby shoot photography in Madurai. Capture your baby's precious moments with creative indoor and outdoor baby photoshoots.",
};

export default function BabyShootPhotographyPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Baby Shoot Photography in Madurai
      </h1>

      <p className="mb-6">
        Kutti Story Photography provides professional baby shoot photography
        in Madurai. We capture beautiful smiles, adorable expressions and
        memorable milestones through creative baby photoshoots.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Creative Baby Photoshoots
      </h2>

      <p>
        Our baby photography sessions are designed to create timeless
        memories. We offer indoor studio shoots, outdoor baby shoots and
        themed photography sessions.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Baby Photography Services
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Newborn Baby Photography</li>
        <li>Monthly Milestone Photoshoots</li>
        <li>Outdoor Baby Photoshoots</li>
        <li>Birthday Baby Shoots</li>
        <li>Family Photography Sessions</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Frequently Asked Questions
      </h2>

      <h3 className="text-xl font-semibold mt-6">
        What is the best age for a baby photoshoot?
      </h3>

      <p>
        Newborn shoots are typically done within the first few weeks,
        while milestone shoots can be done at 3, 6, 9 and 12 months.
      </p>

      <h3 className="text-xl font-semibold mt-6">
        Do you provide props for baby shoots?
      </h3>

      <p>
        Yes. We can provide themes, props and creative concepts for
        memorable baby photography sessions.
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