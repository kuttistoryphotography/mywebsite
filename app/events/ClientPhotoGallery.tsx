"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

type Photo = {
  id: string;
  filename: string;
  uri: string;
};

type EventData = {
  eventCode: string;
  eventName: string;
  clientName: string;
  totalPhotos: number;
  selectionLimit: number;
  status: string;
};

type Props = {
  event: EventData;
  photos: Photo[];
  onBack: () => void;
};

export default function ClientPhotoGallery({
  event,
  photos,
  onBack,
}: Props) {
  const [selected, setSelected] = useState<Photo[]>([]);
  const [rejected, setRejected] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [review, setReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const current = photos[index];

  useEffect(() => {
    if (review || success || photos.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((previous) =>
          previous === 0 ? photos.length - 1 : previous - 1
        );
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((previous) =>
          previous === photos.length - 1 ? 0 : previous + 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [photos.length, review, success]);

  const selectedIds = useMemo(
    () => new Set(selected.map((photo) => photo.id)),
    [selected]
  );

  const rejectedIds = useMemo(
    () => new Set(rejected.map((photo) => photo.id)),
    [rejected]
  );

  const progress =
    event.selectionLimit > 0
      ? Math.min(
          100,
          Math.round((selected.length / event.selectionLimit) * 100)
        )
      : 0;

  function toggleSelect(photo: Photo) {
    setError("");

    if (selectedIds.has(photo.id)) {
      setSelected((previous) =>
        previous.filter((item) => item.id !== photo.id)
      );
      return;
    }

    if (selected.length >= event.selectionLimit) {
      window.alert(
        `Selection Limit Reached!\n\nYou can select up to ${event.selectionLimit} photos only. Please remove a selected photo before choosing another.`
      );
      return;
    }

    setRejected((previous) =>
      previous.filter((item) => item.id !== photo.id)
    );

    setSelected((previous) => [...previous, photo]);
  }

  function toggleReject(photo: Photo) {
    setError("");

    if (rejectedIds.has(photo.id)) {
      setRejected((previous) =>
        previous.filter((item) => item.id !== photo.id)
      );
      return;
    }

    setSelected((previous) =>
      previous.filter((item) => item.id !== photo.id)
    );

    setRejected((previous) => [...previous, photo]);
  }

  async function submitSelection() {
    if (selected.length === 0) {
      setError("Please select at least one photo before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        "/api/photo-selection/client/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventCode: event.eventCode,
            selectedPhotos: selected.map((photo) => ({
              id: photo.id,
              filename: photo.filename,
            })),
            rejectedPhotos: rejected.map((photo) => ({
              id: photo.id,
              filename: photo.filename,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to submit your selection."
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#090909] px-5 py-16 text-white">
        <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            Kutti Story Photography
          </p>

          <h1 className="mt-5 text-3xl font-semibold">
            Selection Submitted!
          </h1>

          <p className="mt-4 leading-7 text-white/60">
            Your selection for {event.eventName} has been submitted
            successfully.
          </p>

          <div className="mt-8 grid w-full grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-3xl font-semibold text-green-400">
                {selected.length}
              </p>
              <p className="mt-2 text-xs text-white/50">
                Selected photos
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-3xl font-semibold">
                {rejected.length}
              </p>
              <p className="mt-2 text-xs text-white/50">
                Rejected photos
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="mt-8 rounded-xl bg-amber-400 px-6 py-3 font-semibold text-black hover:bg-amber-300"
          >
            Back to Events
          </button>
        </section>
      </main>
    );
  }

  if (review) {
    return (
      <main className="min-h-screen bg-[#090909] px-4 py-10 text-white sm:px-6">
        <section className="mx-auto max-w-5xl">
          <button
            onClick={() => setReview(false)}
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to gallery
          </button>

          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            Final Review
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Your Final Collection
          </h1>

          <p className="mt-3 text-sm text-white/60">
            Review your selected photos before submitting.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-green-400/30 bg-green-400/10 px-4 py-2 text-green-300">
              {selected.length} selected
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2 text-white/60">
              {rejected.length} rejected
            </span>
          </div>

          {selected.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 p-8 text-center text-white/60">
              No photos selected yet. Return to the gallery to choose
              your favourites.
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {selected.map((photo, photoIndex) => (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                >
                  <div className="relative aspect-square bg-white/5">
                    <img
                      src={photo.uri}
                      alt={photo.filename}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-1 text-xs">
                      {String(photoIndex + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="p-3">
                    <p className="truncate text-xs text-white/70">
                      {photo.filename}
                    </p>

                    <button
                      onClick={() =>
                        setSelected((previous) =>
                          previous.filter((item) => item.id !== photo.id)
                        )
                      }
                      className="mt-3 w-full rounded-lg border border-red-400/30 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10"
                    >
                      Remove photo
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-5 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setReview(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Edit selection
            </button>

            <button
              onClick={submitSelection}
              disabled={submitting || selected.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Submitting..." : "Submit Final Selection"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#090909]/95 px-4 py-2.5 backdrop-blur sm:px-6 sm:py-3">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em]">
              KUTTISTORY
            </p>
            <p className="mt-1 text-[10px] tracking-[0.3em] text-white/40">
              PHOTOGRAPHY
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">
              {selected.length} / {event.selectionLimit}
            </p>
            <p className="text-xs text-white/40">Photos selected</p>
          </div>
        </div>

        <div className="mx-auto mt-4 max-w-7xl">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-[10px] text-white/40">
            {progress}% of selection limit
          </p>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
              Private Client Gallery
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              {event.eventName}
            </h1>
            <p className="mt-2 text-sm text-white/50">
              {event.clientName} · {photos.length} photos
            </p>
          </div>

          <button
            onClick={() => setReview(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-300"
          >
            Review selection
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {photos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-12 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-white/30" />
            <p className="mt-4 text-white/60">
              No photos are available for this event.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <div className="relative flex h-[45vh] min-h-[260px] max-h-[560px] items-center justify-center sm:h-[58vh] sm:min-h-[360px] lg:h-[65vh]">
                <img
                  src={current.uri}
                  alt={current.filename}
                  className="h-full w-full object-contain"
                />

                <button
                  aria-label="Previous photo"
                  onClick={() =>
                    setIndex((previous) =>
                      previous === 0 ? photos.length - 1 : previous - 1
                    )
                  }
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 hover:bg-black"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  aria-label="Next photo"
                  onClick={() =>
                    setIndex((previous) =>
                      previous === photos.length - 1 ? 0 : previous + 1
                    )
                  }
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 hover:bg-black"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute bottom-3 left-3 rounded-lg bg-black/75 px-3 py-2 text-xs">
                  {index + 1} / {photos.length}
                </div>

                {selectedIds.has(current.id) && (
                  <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-green-500 px-3 py-2 text-xs font-semibold text-white">
                    <Check className="h-4 w-4" />
                    SELECTED
                  </div>
                )}

                {rejectedIds.has(current.id) && (
                  <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-red-500 px-3 py-2 text-xs font-semibold text-white">
                    <X className="h-4 w-4" />
                    REJECTED
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {current.filename}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Photo {index + 1} of {photos.length}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                  <button
                    onClick={() => toggleReject(current)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm sm:flex-none ${
                      rejectedIds.has(current.id)
                        ? "border-red-400 bg-red-400/15 text-red-300"
                        : "border-white/15 text-white/70 hover:bg-white/5"
                    }`}
                  >
                    <X className="h-4 w-4" />
                    {rejectedIds.has(current.id) ? "Rejected" : "Reject"}
                  </button>

                  <button
                    onClick={() => toggleSelect(current)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold sm:flex-none ${
                      selectedIds.has(current.id)
                        ? "bg-green-500 text-white"
                        : "bg-amber-400 text-black hover:bg-amber-300"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    {selectedIds.has(current.id) ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto overscroll-x-contain pb-3 sm:mt-5">
              {photos.map((photo, photoIndex) => (
                <button
                  key={photo.id}
                  onClick={() => setIndex(photoIndex)}
                  aria-label={`Open photo ${photoIndex + 1}`}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px] ${
                    index === photoIndex
                      ? "border-amber-400"
                      : "border-white/10"
                  }`}
                >
                  <img
                    src={photo.uri}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {selectedIds.has(photo.id) && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  {rejectedIds.has(photo.id) && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-white/70 hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            onClick={() => setReview(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-semibold text-black hover:bg-amber-300"
          >
            Review {selected.length} selected photos
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}
