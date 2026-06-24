import Link from "next/link";

export const metadata = {
  title: "Tamil Wedding Photography Checklist | Kutti Story Photography",
  description:
    "Complete Tamil wedding photography checklist covering engagement, muhurtham, reception and family moments to capture on your special day.",
};

export default function TamilWeddingPhotographyChecklistPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">
        Tamil Wedding Photography Checklist
      </h1>

      <p className="mb-6">
        Tamil weddings are filled with beautiful traditions and emotional
        moments. Having a photography checklist ensures that every important
        ceremony and family memory is captured perfectly.
      </p>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Before the Wedding
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Engagement Ceremony</li>
        <li>Pre Wedding Photoshoot</li>
        <li>Wedding Invitation Details</li>
        <li>Family Portraits</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Wedding Day Moments
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Bride Getting Ready</li>
        <li>Groom Getting Ready</li>
        <li>Maalai Maatral</li>
        <li>Oonjal Ceremony</li>
        <li>Kanyadanam</li>
        <li>Mangalyadharanam (Thaali Ceremony)</li>
        <li>Sapthapadi</li>
        <li>Family Blessings</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Reception Checklist
      </h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>Couple Portraits</li>
        <li>Stage Decorations</li>
        <li>Guest Interactions</li>
        <li>Cake Cutting</li>
        <li>Family Group Photos</li>
      </ul>

      <h2 className="text-3xl font-bold mt-10 mb-4">
        Why Choose Kutti Story Photography?
      </h2>

      <p>
        We specialize in traditional Tamil wedding photography, candid
        wedding photography and cinematic wedding films across Madurai
        and Tamil Nadu.
      </p>

      <div className="mt-10">
        <Link
          href="/best-wedding-photographer-in-madurai"
          className="text-amber-500 underline"
        >
          Explore Our Wedding Photography Services
        </Link>
      </div>
    </main>
  );
}