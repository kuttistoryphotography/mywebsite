"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { toImageUrl } from "@/lib/media";

export interface GalleryStory {
  label: string;
  title: string;
  text: string;
}

interface BlogPreviewData {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  cover_image: string;
  image_alt: string;
  gallery_images: string[];
  gallery_stories: GalleryStory[];
}

interface BlogLivePreviewProps {
  data: BlogPreviewData;
  onClose: () => void;
}

export default function BlogLivePreview({
  data,
  onClose,
}: BlogLivePreviewProps) {
  const getStory = (index: number) => {
    return data.gallery_stories?.[index] || {
      label: "",
      title: "",
      text: "",
    };
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 overflow-y-auto">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em]">
              Blog Preview
            </p>

            <p className="text-zinc-400 text-sm mt-1">
              Preview your blog before publishing
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 md:px-10 py-16 pb-32">

        {/* Category */}
        {data.category && (
          <p className="text-orange-500 text-xs font-bold tracking-[0.3em] uppercase">
            {data.category}
          </p>
        )}

        {/* Title */}
        <h1 className="mt-5 text-4xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
          {data.title || "Your Blog Title"}
        </h1>

        {/* Excerpt */}
        {data.excerpt && (
          <p className="mt-8 max-w-3xl text-zinc-400 text-lg md:text-xl leading-relaxed">
            {data.excerpt}
          </p>
        )}

        {/* Cover Image */}
        {data.cover_image && (
          <div className="relative mt-12 aspect-[16/9] overflow-hidden bg-zinc-900">
            <Image
              src={toImageUrl(data.cover_image, 2000)}
              alt={data.image_alt || data.title || "Blog cover image"}
              fill
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Blog Content */}
        {data.content && (
          <div
            className="blog-preview-content mt-16 prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{
              __html: data.content,
            }}
          />
        )}

        {/* Gallery */}
        {data.gallery_images?.length > 0 && (
          <section className="mt-24 md:mt-32">

            {/* Gallery Heading */}
            <div className="mb-16 text-center">
              <p className="text-orange-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">
                Photo Story
              </p>

              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
                The Gallery
              </h2>
            </div>

            {/* Images 1 + 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              {data.gallery_images.slice(0, 2).map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative aspect-[4/5] overflow-hidden bg-zinc-900"
                >
                  <Image
                    src={toImageUrl(image, 1800)}
                    alt={`${data.title} - Gallery Image ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>

            {/* Story 1 */}
            {data.gallery_images.length >= 2 && (
              <StoryBlock
                story={getStory(0)}
                position="right"
              />
            )}

            {/* Images 3 + 4 */}
            {data.gallery_images.length > 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                {data.gallery_images.slice(2, 4).map((image, index) => (
                  <div
                    key={`${image}-${index + 2}`}
                    className={`relative overflow-hidden bg-zinc-900 ${
                      index === 0
                        ? "aspect-[3/2]"
                        : "aspect-[4/5]"
                    }`}
                  >
                    <Image
                      src={toImageUrl(image, 1800)}
                      alt={`${data.title} - Gallery Image ${index + 3}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Story 2 */}
            {data.gallery_images.length >= 4 && (
              <StoryBlock
                story={getStory(1)}
                position="left"
              />
            )}

            {/* Image 5 */}
            {data.gallery_images[4] && (
              <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
                <Image
                  src={toImageUrl(data.gallery_images[4], 2000)}
                  alt={`${data.title} - Gallery Image 5`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Story 3 */}
            {data.gallery_images.length >= 5 && (
              <StoryBlock
                story={getStory(2)}
                position="center"
              />
            )}

            {/* Images 6 + 7 */}
            {data.gallery_images.length > 5 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                {data.gallery_images.slice(5, 7).map((image, index) => (
                  <div
                    key={`${image}-${index + 5}`}
                    className={`relative overflow-hidden bg-zinc-900 ${
                      index === 0
                        ? "aspect-[4/5]"
                        : "aspect-[3/2]"
                    }`}
                  >
                    <Image
                      src={toImageUrl(image, 1800)}
                      alt={`${data.title} - Gallery Image ${index + 6}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Story 4 */}
            {data.gallery_images.length >= 7 && (
              <StoryBlock
                story={getStory(3)}
                position="right"
              />
            )}

          </section>
        )}
      </main>
    </div>
  );
}

function StoryBlock({
  story,
  position,
}: {
  story: GalleryStory;
  position: "left" | "right" | "center";
}) {
  if (!story.label && !story.title && !story.text) {
    return null;
  }

  const positionClass =
    position === "right"
      ? "max-w-2xl ml-auto"
      : position === "center"
      ? "max-w-3xl mx-auto text-center"
      : "max-w-2xl";

  return (
    <div className={`my-20 md:my-32 ${positionClass}`}>
      {story.label && (
        <span className="text-orange-500 text-xs font-bold tracking-[0.3em] uppercase">
          {story.label}
        </span>
      )}

      {story.title && (
        <h3 className="mt-5 text-4xl md:text-6xl font-bold tracking-tighter leading-[0.95]">
          {story.title}
        </h3>
      )}

      {story.text && (
        <p className="mt-6 text-zinc-400 text-base md:text-lg leading-relaxed">
          {story.text}
        </p>
      )}
    </div>
  );
}