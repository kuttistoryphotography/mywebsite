
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {availableCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category)}
              className="group overflow-hidden text-left"
            >
              <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                {category.coverImage ? (
                  <img
                    src={category.coverImage}
                    alt={category.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-stone-500">
                    View collection
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-b py-4">
                <div>
                  <h3 className="text-lg font-medium">{category.title}</h3>
                  <p className="mt-1 text-sm opacity-60">
                    {category.photos.length} photographs
                  </p>
                </div>
                <span style={{ color: accentColor }}>↗</span>
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

          <h3 className="mb-6 text-2xl font-light">
            {activeCategory.title}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCategory.photos.slice(0, 15).map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setActivePhoto(url)}
                className="overflow-hidden"
              >
                <img
                  src={url}
                  alt={`${activeCategory.title} ${index + 1}`}
                  loading="lazy"
                  className="h-72 w-full object-cover"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
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
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
