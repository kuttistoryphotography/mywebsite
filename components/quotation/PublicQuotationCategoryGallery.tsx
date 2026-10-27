
"use client";

import { useState } from "react";

type GalleryCategory = {
  id: string;
  title: string;
  coverImage: string;
  photos: string[];
};

export default function PublicQuotationCategoryGallery({
  categories,
  accentColor,
}: {
  categories: GalleryCategory[];
  accentColor: string;
}) {
  const [activeCategory, setActiveCategory] =
    useState<GalleryCategory | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const availableCategories = categories.filter(
    (category) => category.coverImage || category.photos.length > 0
  );

  if (!availableCategories.length) return null;

  return (
    <div>
      {!activeCategory ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-14">
          {availableCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category)}
              className="group block w-full overflow-hidden text-left"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f1ede5]">
                {category.coverImage ? (
                  <img
                    src={category.coverImage}
                    alt={category.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-stone-500">
                    View collection
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-[#c6a66b]/40 py-5">
                <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#9b8054]">
                    Photography Collection
                    </p>

                    <h3 className="font-serif text-2xl font-normal tracking-wide text-[#29251f]">
                    {category.title}
                    </h3>

                    <p className="mt-2 text-xs tracking-wide text-[#777066]">
                    {category.photos.length} photographs
                    </p>
                </div>

                <span
                    className="mt-1 text-xl transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                    style={{ color: accentColor }}
                    aria-hidden="true"
                >
                    ↗
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className="mb-6 text-sm underline underline-offset-4"
            style={{ color: accentColor }}
          >
            ← All collections
          </button>

          <div className="mb-8 border-b border-[#c6a66b]/40 pb-6">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#9b8054]">
                The Collection
            </p>

            <h3 className="font-serif text-3xl font-normal text-[#29251f] sm:text-4xl">
                {activeCategory.title}
            </h3>

            <p className="mt-3 text-sm text-[#777066]">
                A curated collection of {activeCategory.photos.length} photographs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            {activeCategory.photos.slice(0, 15).map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setActivePhoto(url)}
                className="group relative block aspect-[4/5] w-full overflow-hidden bg-[#f1ede5]"
              >
                <img
                  src={url}
                  alt={`${activeCategory.title} ${index + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>

          {activeCategory.photos.length === 0 && (
            <p className="py-10 text-center text-sm opacity-60">
              Photographs will be added to this collection.
            </p>
          )}
        </div>
      )}

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#171511]/95 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setActivePhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photograph preview"
        >
          <button
            type="button"
            onClick={() => setActivePhoto(null)}
            className="absolute right-5 top-5 text-3xl text-white"
            aria-label="Close preview"
          >
            ×
          </button>

          <img
            src={activePhoto}
            alt="Selected wedding photograph"
            className="max-h-[88vh] max-w-full object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
