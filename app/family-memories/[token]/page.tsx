
import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import User from "@/models/User";
import FamilyFriendsLink from "@/models/FamilyFriendsLink";
import MemoriesAccessButton from "@/components/memories/memories-access-button";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function FamilyMemoriesPage({
  params,
}: PageProps) {
  const { token } = await params;

  // Validate the unique sharing token.
  if (!/^[a-f0-9]{64}$/.test(token)) {
    notFound();
  }

  await connectDB();

  // Only active sharing links can be opened.
  const link = await FamilyFriendsLink.findOne({
    token,
    status: "active",
  }).lean();

  if (!link) {
    notFound();
  }

  // The link must belong to an active client.
  const user = await User.findOne({
    _id: link.clientId,
    role: "client",
    isActive: true,
  })
    .select("firstName lastName googleReviewUrl")
    .lean();

  if (!user) {
    notFound();
  }

  const clientName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Kutti Story Photography
            </h1>

            <p className="text-sm text-zinc-500 mt-2">
              Capturing Life, One Story at a Time
            </p>
          </header>

          <section className="mb-8">
            <div className="text-5xl mb-4" aria-hidden="true">
              ❤️
            </div>

            <h2 className="text-2xl font-semibold">
              {link.recipientName
                ? `${link.recipientName}'s Memories`
                : "Your Memories"}
            </h2>

            <p className="text-zinc-400 text-sm leading-6 mt-3">
              {clientName
                ? `Memories shared from ${clientName}'s special occasion.`
                : "Memories shared with you by Kutti Story Photography."}
              {" "}Enjoy these special moments and memories.
            </p>
          </section>

          {user.googleReviewUrl && (
            <div className="mb-4">
              <a
                href={user.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 px-5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
              >
                ⭐ Leave a Google Review
              </a>

              <p className="text-xs text-zinc-500 mt-2">
                Your honest feedback helps our photography team grow.
              </p>
            </div>
          )}

          <MemoriesAccessButton driveUrl={link.driveUrl} />

          <footer className="mt-8 pt-5 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              Made with love by Kutti Story Photography
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
