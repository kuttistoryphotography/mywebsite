import GropuChild from "../../components/faq/group";
import connectDB from "@/lib/db";
import FaqSettings from "@/models/FaqSettings";

export const dynamic = "force-dynamic";

async function getFaqData() {
  try {
    await connectDB();

    const settings = await FaqSettings.findOne()
      .select("categories")
      .lean();

    return settings;
  } catch (error) {
    console.error("FAQ schema data error:", error);
    return null;
  }
}

export default async function FaqSection() {
  const settings = await getFaqData();

  const faqItems =
    settings?.categories?.flatMap((category) =>
      Array.isArray(category.items)
        ? category.items
            .filter(
              (item) =>
                item.question?.trim() &&
                item.answer?.trim()
            )
            .map((item) => ({
              "@type": "Question",
              name: item.question.trim(),
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer.trim(),
              },
            }))
        : []
    ) || [];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems,
  };

  return (
    <>
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}

      <GropuChild />
    </>
  );
}