"use client";

import { useParams, useRouter } from "next/navigation";

export default function PhotoSelectionManagePage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push("/admin?tab=photo_selection")}
          className="mb-6 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          ← Back to Photo Selection
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold">
            Manage Photo Selection
          </h1>

          <p className="mt-1 text-sm text-zinc-400">
            Manage this event and connect photos for client selection.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">
            Event ID
          </p>

          <p className="mt-2 font-mono text-sm text-amber-400">
            {eventId}
          </p>
        </div>
      </div>
    </div>
  );
}