
"use client";

import { useState } from "react";

import { ArrowRight, Images, LockKeyhole } from "lucide-react";
import ClientPhotoGallery from "./ClientPhotoGallery";

export default function EventsPage() {
  const [eventCode, setEventCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedEvent, setLoadedEvent] = useState<any>(null);
  const [loadedPhotos, setLoadedPhotos] = useState<any[]>([]);

  const handleContinue = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const code = eventCode.trim().toUpperCase();

    if (!code) {
      setError("Please enter your event code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/photo-selection/client/event?code=${encodeURIComponent(code)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error || "Invalid event code. Please try again."
        );
        return;
      }

      setLoadedEvent(data.event);

        setLoadedPhotos(
        (data.photos || []).map((photo: any) => ({
            id: String(photo.id),
            filename: photo.originalFilename,
            uri:
            photo.previewUrl ||
            photo.thumbnailUrl ||
            photo.cloudinaryUrl ||
            "",
        }))
        );
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadedEvent) {
    return (
        <ClientPhotoGallery
        event={loadedEvent}
        photos={loadedPhotos}
        onBack={() => {
            setLoadedEvent(null);
            setLoadedPhotos([]);
            setEventCode("");
            setError("");
        }}
        />
    );
    }

  return (
    <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-5 py-28">
      <section className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <Images className="h-8 w-8 text-amber-400" />
          </div>

          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-amber-400">
            Kutti Story Photography
          </p>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-wide">
            Your Event Gallery
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/60">
            Enter the event access code provided by our team
            to view and select your photographs.
          </p>
        </div>

        <form
          onSubmit={handleContinue}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 shadow-2xl"
        >
          <label
            htmlFor="eventCode"
            className="mb-3 block text-sm font-medium text-white/80"
          >
            Event Access Code
          </label>

          <div className="relative">
            <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />

            <input
              id="eventCode"
              name="eventCode"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value)}
              placeholder="Enter your event code"
              maxLength={100}
              required
              className="w-full rounded-xl border border-white/15 bg-black/40 py-4 pl-12 pr-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-amber-400"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !eventCode.trim()}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-amber-400 px-5 py-4 font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying Code..." : "Access My Gallery"}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-white/40">
            Having trouble accessing your gallery? Please
            contact Kutti Story Photography.
          </p>
        </form>
      </section>
    </main>
  );
}
