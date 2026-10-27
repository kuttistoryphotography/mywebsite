
"use client";

import { useRef, useState } from "react";

export type QuotationGalleryCategory = {
  id: string;
  title: string;
  coverImage: string;
  photos: string[];
};

type Props = {
  categories: QuotationGalleryCategory[];
  onChange: (categories: QuotationGalleryCategory[]) => void;
};

const MAX_PHOTOS = 15;
const PINK = "#ec2396";

export default function QuotationCategoryGallery({
  categories,
  onChange,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCategory =
    categories.find((category) => category.id === activeId) ?? null;

  function updateCategory(
    id: string,
    updater: (category: QuotationGalleryCategory) => QuotationGalleryCategory
  ) {
    onChange(
      categories.map((category) =>
        category.id === id ? updater(category) : category
      )
    );
  }

  async function uploadFiles(
    files: FileList | File[],
    categoryId: string,
    kind: "cover" | "photos"
  ) {
    const selected = Array.from(files);
    if (!selected.length) return;

    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;

    if (kind === "photos") {
      const remaining = MAX_PHOTOS - category.photos.length;
      if (remaining <= 0) {
        setError(`This category already has ${MAX_PHOTOS} photos.`);
        return;
      }

      if (selected.length > remaining) {
        setError(`You can add only ${remaining} more photo(s) here.`);
        return;
      }
    }

    const invalid = selected.find(
      (file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024
    );

    if (invalid) {
      setError("Choose image files up to 5 MB each.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploaded: string[] = [];

      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("context", "quote");
        formData.append("label", `Quotation ${category.title}`);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const text = await response.text();
        let result: { success?: boolean; url?: string; error?: string };

        try {
          result = JSON.parse(text);
        } catch {
          throw new Error(
            `Upload failed (HTTP ${response.status}). Check the Vercel runtime logs.`
          );
        }

        if (!response.ok || !result.success || !result.url) {
          throw new Error(result.error || `Upload failed for ${file.name}`);
        }

        uploaded.push(result.url);
      }

      updateCategory(categoryId, (current) =>
        kind === "cover"
          ? { ...current, coverImage: uploaded[0] }
          : { ...current, photos: [...current.photos, ...uploaded] }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(categoryId: string, photoUrl: string) {
    updateCategory(categoryId, (category) => ({
      ...category,
      photos: category.photos.filter((url) => url !== photoUrl),
    }));
  }

  return (
    <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Quotation Category Galleries
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Choose a cover image and add up to 15 photos to each category.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {categories.map((category) => (
          <article
            key={category.id}
            className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 p-3"
          >
            <button
              type="button"
              onClick={() => setActiveId(category.id)}
              className="block w-full text-left"
              aria-label={`Open ${category.title} gallery`}
            >
              <div className="relative h-44 overflow-hidden rounded-lg bg-zinc-800">
                {category.coverImage ? (
                  <img
                    src={category.coverImage}
                    alt={`${category.title} cover`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                    No cover image selected
                  </div>
                )}
              </div>

              <span
                className="relative mx-auto -mt-4 flex min-h-10 w-[85%] items-center justify-center rounded-md px-3 text-sm font-medium text-white"
                style={{ backgroundColor: PINK }}
              >
                {category.title}
              </span>
            </button>

            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span>{category.photos.length}/{MAX_PHOTOS} photos</span>
              <button
                type="button"
                onClick={() => {
                  setActiveId(category.id);
                  setError("");
                  window.setTimeout(() => {
                    document.getElementById("quotation-gallery-editor")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 0);
                }}
                className="rounded-md border border-zinc-700 px-3 py-2 text-white hover:bg-zinc-800"
              >
                Manage gallery
              </button>
            </div>
          </article>
        ))}
      </div>

      {activeCategory && (
        <div
          id="quotation-gallery-editor"
          className="space-y-5 rounded-xl border border-pink-500/40 bg-zinc-950 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">
                {activeCategory.title}
              </h3>
              <p className="text-sm text-zinc-400">
                Cover image and gallery photos
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-white"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-300">Cover image</p>
              {activeCategory.coverImage && (
                <img
                  src={activeCategory.coverImage}
                  alt="Selected cover"
                  className="h-36 w-full rounded-lg object-cover"
                />
              )}
              <label className="inline-flex cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: PINK }}>
                Upload / change cover
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    if (event.target.files) {
                      void uploadFiles(event.target.files, activeCategory.id, "cover");
                    }
                  }}
                />
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-300">
                Gallery photos ({activeCategory.photos.length}/{MAX_PHOTOS})
              </p>
              <label className="inline-flex cursor-pointer rounded-lg border border-zinc-600 px-4 py-2 text-sm text-white hover:bg-zinc-800">
                Add gallery photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading || activeCategory.photos.length >= MAX_PHOTOS}
                  onChange={(event) => {
                    if (event.target.files) {
                      void uploadFiles(event.target.files, activeCategory.id, "photos");
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <p className="text-xs text-zinc-500">
                Select up to {MAX_PHOTOS - activeCategory.photos.length} more photo(s).
              </p>
            </div>
          </div>

          {uploading && (
            <p role="status" className="text-sm text-amber-300">
              Uploading images to Cloudinary…
            </p>
          )}

          {activeCategory.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {activeCategory.photos.map((url, index) => (
                <div key={`${url}-${index}`} className="relative">
                  <button
                    type="button"
                    onClick={() => setPreview(url)}
                    className="block w-full overflow-hidden rounded-lg border border-zinc-700"
                    aria-label={`Preview photo ${index + 1}`}
                  >
                    <img
                      src={url}
                      alt={`${activeCategory.title} photo ${index + 1}`}
                      className="h-28 w-full object-cover"
                    />
                  </button>
                  <span className="mt-1 block truncate text-xs text-zinc-400">
                    Photo {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePhoto(activeCategory.id, url)}
                    className="mt-1 rounded bg-red-500/15 px-2 py-1 text-xs text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-400">
              No gallery photos yet. Add up to 15 photos.
            </p>
          )}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            className="absolute right-5 top-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
            onClick={() => setPreview(null)}
          >
            Close
          </button>
          <img
            src={preview}
            alt="Gallery preview"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </section>
  );
}
