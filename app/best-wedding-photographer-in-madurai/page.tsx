import SEOHero from "@/components/seo/SEOHero";
import Link from "next/link";
export const metadata = {
  title: "Best Wedding Photographer in Madurai",

  description:
    "Looking for the best wedding photographer in Madurai? Kutti Story Photography specializes in candid wedding photography, cinematic wedding films and traditional Tamil wedding photography.",

  alternates: {
    canonical:
      "https://www.kuttistoryphotography.com/best-wedding-photographer-in-madurai",
  },

  openGraph: {
    title: "Best Wedding Photographer in Madurai",
    description:
      "Looking for the best wedding photographer in Madurai? Kutti Story Photography specializes in candid wedding photography, cinematic wedding films and traditional Tamil wedding photography.",
    url: "https://www.kuttistoryphotography.com/best-wedding-photographer-in-madurai",
  },

  twitter: {
    title: "Best Wedding Photographer in Madurai",
    description:
      "Looking for the best wedding photographer in Madurai? Kutti Story Photography specializes in candid wedding photography, cinematic wedding films and traditional Tamil wedding photography.",
  },
};

export default function BestWeddingPhotographerPage() {
return (
  <>
    <SEOHero
      title="Best Wedding Photographer in Madurai"
      description="Looking for the best wedding photographer in Madurai? Kutti Story Photography specializes in candid wedding photography, cinematic wedding videography, traditional Tamil wedding photography, engagement photography, pre wedding shoots and luxury wedding albums."
      image="/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp"
    />

    <main className="bg-[#0a0a0a] text-white">
     <div className="max-w-6xl mx-auto px-6 py-20 space-y-16">

<h2 className="text-2xl font-semibold mt-10 mb-4">
  Why Choose Kutti Story Photography?
</h2>

<p>
  We capture genuine emotions, timeless memories and beautiful wedding
  stories across Madurai and Tamil Nadu. Our team specializes in candid
  wedding photography, cinematic wedding films and traditional Tamil
  wedding photography.
</p>

<h2 className="text-3xl font-bold mt-10 mb-4">
  Our Wedding Photography Services
</h2>

<ul className="list-disc pl-6 space-y-2">
  <li>Candid Wedding Photography</li>
  <li>Traditional Tamil Wedding Photography</li>
  <li>Cinematic Wedding Videography</li>
  <li>Pre Wedding Photography</li>
  <li>Post Wedding Photography</li>
  <li>Engagement Photography</li>
  <li>Reception Photography</li>
</ul>

<h2 className="text-3xl font-bold mt-10 mb-4">
  Locations We Serve
</h2>

<p>
  We provide wedding photography services in Madurai, Dindigul,
  Theni, Sivakasi, Virudhunagar, Chennai, Pondicherry,
  Kerala and across Tamil Nadu.
</p>

<h2 className="text-3xl font-bold mt-10 mb-4">
  Wedding Photography Packages in Madurai
</h2>

<p>
  Every wedding is unique, and our team ensures that every emotion,
  tradition and celebration is beautifully documented. From intimate
  ceremonies to grand weddings, we create stunning wedding photographs
  and cinematic films that couples cherish forever.
</p>

<p className="mt-4">
  Our wedding photography packages are designed to suit different budgets
  while maintaining premium quality. We offer photography, videography,
  drone coverage, cinematic highlight films and wedding albums.
</p>

<p>
  Kutti Story Photography offers affordable wedding photography and
  videography packages in Madurai. We provide candid photography,
  traditional photography, cinematic wedding films, drone coverage,
  engagement photography and reception photography.
</p>

<h2 className="text-3xl font-bold mt-10 mb-4">
  Frequently Asked Questions
</h2>

        <h3 className="text-xl font-semibold mt-6">
        Who is the best wedding photographer in Madurai?
        </h3>

        <p>
        Kutti Story Photography is known for candid wedding photography,
        cinematic wedding films and traditional Tamil wedding coverage.
        </p>

        <h3 className="text-xl font-semibold mt-6">
        Do you provide wedding videography?
        </h3>

        <p>
        Yes, we provide cinematic wedding videography and teaser films.
        </p>

        <h3 className="text-xl font-semibold mt-6">
        Do you travel outside Madurai?
        </h3>

        <p>
        Yes. We cover weddings across Tamil Nadu and South India.
        </p>
        
        <h2 className="text-3xl font-bold mt-10 mb-4">
        Book Your Wedding Photographer Today
        </h2>

        <p>
        Planning your wedding in Madurai? Contact Kutti Story Photography for
        professional wedding photography and videography services. Let us
        capture your special moments with creativity and passion.
        </p>

        <div className="flex gap-6 mt-6">
        <Link href="/works" className="text-amber-500 underline">
            View Our Wedding Portfolio
        </Link>

        <Link href="/contact-us" className="text-amber-500 underline">
            Contact Us
        </Link>
        </div>
                
     </div>
    </main>
  </>
  );
}