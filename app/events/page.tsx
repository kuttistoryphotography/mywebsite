
"use client";

import { useCallback, useState } from "react";

import { ArrowRight, Images, LockKeyhole } from "lucide-react";
import ClientPhotoGallery from "./ClientPhotoGallery";

type Photo = {
  id: string;
  filename: string;
  uri: string;
  thumbnailUri: string;
};

const PAGE_SIZE = 100;

export default function EventsPage() {
  const [eventCode, setEventCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedEvent, setLoadedEvent] = useState<any>(null);
  const [loadedPhotos, setLoadedPhotos] = useState<Photo[]>([]);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false);

  const mapPhotos = (photos: any[]): Photo[] =>
    photos.map((photo: any) => ({
      id: String(photo.id),
      filename: photo.originalFilename,
      uri:
        photo.previewUrl ||
        photo.thumbnailUrl ||
        photo.cloudinaryUrl ||
        "",
      thumbnailUri:
        photo.thumbnailUrl ||
        photo.previewUrl ||
        photo.cloudinaryUrl ||
        "",
    }));

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
    setLoadedEvent(null);
    setLoadedPhotos([]);
    setHasMorePhotos(false);

    try {
      const response = await fetch(
        `/api/photo-selection/client/event?code=${encodeURIComponent(
          code
        )}&page=1&limit=${PAGE_SIZE}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error || "Invalid event code. Please try again."
        );
        return;
      }

      setLoadedEvent(data.event);
      setLoadedPhotos(mapPhotos(data.photos || []));
      setHasMorePhotos(Boolean(data.pagination?.hasMore));
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadMorePhotos = useCallback(async () => {
    if (
      !loadedEvent ||
      loadingMorePhotos ||
      !hasMorePhotos
    ) {
      return;
    }

    setLoadingMorePhotos(true);

    try {
      const nextPage =
        Math.floor(loadedPhotos.length / PAGE_SIZE) + 1;

      const response = await fetch(
        `/api/photo-selection/client/event?code=${encodeURIComponent(
          loadedEvent.eventCode
        )}&page=${nextPage}&limit=${PAGE_SIZE}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load more photos."
        );
      }

      const newPhotos = mapPhotos(data.photos || []);

      setLoadedPhotos((previous) => {
        const existingIds = new Set(
          previous.map((photo) => photo.id)
        );

        const uniqueNewPhotos = newPhotos.filter(
          (photo) => !existingIds.has(photo.id)
        );

        return [...previous, ...uniqueNewPhotos];
      });

      setHasMorePhotos(
        Boolean(data.pagination?.hasMore)
      );
    } catch (err) {
      console.error("Failed to load more photos:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load more photos."
      );
    } finally {
      setLoadingMorePhotos(false);
    }
  }, [
    loadedEvent,
    loadingMorePhotos,
    hasMorePhotos,
    loadedPhotos.length,
  ]);

  const handleBack = () => {
    setLoadedEvent(null);
    setLoadedPhotos([]);
    setHasMorePhotos(false);
    setLoadingMorePhotos(false);
    setEventCode("");
    setError("");
  };

  if (loadedEvent) {
    return (
      <ClientPhotoGallery
        event={loadedEvent}
        photos={loadedPhotos}
        hasMorePhotos={hasMorePhotos}
        loadingMorePhotos={loadingMorePhotos}
        loadMorePhotos={loadMorePhotos}
        onBack={handleBack}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-5 py-28 text-white">
      <section className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <Images className="h-8 w-8 text-amber-400" />
          </div>

          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-amber-400">
            Kutti Story Photography
          </p>

          <h1 className="text-3xl font-semibold tracking-wide sm:text-4xl">
            Your Event Gallery
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/60">
            Enter the event access code provided by our team
            to view and select your photographs.
          </p>
        </div>

        <form
          onSubmit={handleContinue}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8"
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
            {loading
              ? "Verifying Code..."
              : "Access My Gallery"}

            {!loading && (
              <ArrowRight className="h-5 w-5" />
            )}
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
