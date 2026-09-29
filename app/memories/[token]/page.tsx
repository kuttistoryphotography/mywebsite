import { notFound } from "next/navigation";
import User from "@/models/User";
import connectDB from "@/lib/db";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function MemoriesSharePage({
  params,
}: PageProps) {
  const { token } = await params;

  await connectDB();

  const user = await User.findOne({
    memoriesShareToken: token,
    role: "client",
    isActive: true,
  }).select(
    "firstName lastName memoriesDriveUrl googleReviewUrl"
  );

  if (!user) {
    notFound();
  }

  const clientName = `${user.firstName || ""} ${
    user.lastName || ""
  }`.trim();

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">

          {/* Brand */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Kutti Story Photography
            </h1>

            <p className="text-sm text-zinc-500 mt-2">
              Capturing Life, One Story at a Time
            </p>
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <div className="text-5xl mb-4">
              ❤️
            </div>

            <h2 className="text-2xl font-semibold">
              {clientName
                ? `${clientName}'s Memories`
                : "Your Memories"}
            </h2>

            <p className="text-zinc-400 text-sm leading-6 mt-3">
              Your special moments are waiting for you.
              You can also share your experience with us
              on Google.
            </p>
          </div>

          {/* Google Review */}
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
                Please share your genuine experience with
                Kutti Story Photography.
              </p>
            </div>
          )}

          {/* Memories */}
          {user.memoriesDriveUrl ? (
            <a
              href={user.memoriesDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3.5 px-5 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
            >
              📸 View Your Memories
            </a>
          ) : (
            <div className="rounded-xl bg-zinc-800/70 border border-zinc-700 p-4">
              <p className="text-sm text-zinc-400">
                Your memories are not available yet.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} Kutti Story Photography
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}