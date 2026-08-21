"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { toImageUrl } from "@/lib/media";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type BlogPostData = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author_name: string;

  cover_image: string;
  image_alt: string;

  category: string;
  tags?: string[];
  is_featured?: boolean;

  meta_title?: string;
  meta_description?: string;

  created_at: string;
  published_at: string | null;

  galleryImages?: string[];
};

const estimateReadTime = (html = "") => {
  const words = html
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.ceil(words / 220));

  return `${minutes} min read`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/* =========================================
   CLEAN BLOG CONTENT
========================================= */

const formatBlogContent = (content = "") => {
  if (!content.trim()) return "";

  let cleaned = content.trim();

  /*
    Remove unwanted placeholder heading
    like:
    # Short HTML Blog Content
  */

  cleaned = cleaned.replace(
    /^#\s*Short HTML Blog Content\s*/i,
    ""
  );

  /*
    If the content already contains HTML,
    return it normally.
  */

  if (/<[a-z][\s\S]*>/i.test(cleaned)) {
    return cleaned;
  }

  /*
    Convert simple plain text / markdown-style
    blog content into editorial HTML.
  */

  const lines = cleaned.split(/\n+/);

  let html = "";
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;

    const text = paragraphBuffer.join(" ").trim();

    if (text) {
      html += `<p>${text}</p>`;
    }

    paragraphBuffer = [];
  };

  lines.forEach((line) => {
    const text = line.trim();

    if (!text) {
      flushParagraph();
      return;
    }

    /*
      Main markdown heading
    */

    if (/^##\s+/.test(text)) {
      flushParagraph();

      html += `<h2>${text.replace(/^##\s+/, "")}</h2>`;

      return;
    }

    /*
      Sub heading
    */

    if (/^###\s+/.test(text)) {
      flushParagraph();

      html += `<h3>${text.replace(/^###\s+/, "")}</h3>`;

      return;
    }

    /*
      Numbered headings such as:
      1. Choosing Only Based on Price
    */

    if (/^\d+\.\s+[A-Z]/.test(text)) {
      flushParagraph();

      const match = text.match(/^(\d+)\.\s+(.+)$/);

      if (match) {
        html += `
          <div class="editorial-section-heading">
            <span class="section-number">
              ${match[1].padStart(2, "0")}
            </span>

            <h2>${match[2]}</h2>
          </div>
        `;

        return;
      }
    }

    paragraphBuffer.push(text);
  });

  flushParagraph();

  return html;
};

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const containerRef = useRef<HTMLElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);

  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================================
     FETCH BLOG
  ========================================= */

  useEffect(() => {
    let mounted = true;

    const fetchBlog = async () => {
      try {
        if (!params?.slug) {
          if (mounted) setPost(null);
          return;
        }

        const res = await fetch(
          `/api/blog/slug/${params.slug}`
        );

        if (!mounted) return;

        if (!res.ok) {
          setPost(null);
          return;
        }

        const data = await res.json();

        setPost(data.blog || null);
      } catch (error) {
        console.error(
          "Failed to fetch blog post:",
          error
        );

        if (mounted) {
          setPost(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBlog();

    return () => {
      mounted = false;
    };
  }, [params?.slug]);

  /* =========================================
     GSAP ANIMATION
  ========================================= */

  useEffect(() => {
    if (!post || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
      });

      tl.from(
        ".journal-label",
        {
          y: 20,
          opacity: 0,
          duration: 0.8,
        }
      )
        .from(
          ".blog-title",
          {
            y: 100,
            opacity: 0,
            duration: 1.2,
          },
          "-=0.4"
        )
        .from(
          ".blog-meta",
          {
            y: 25,
            opacity: 0,
            stagger: 0.12,
            duration: 0.8,
          },
          "-=0.8"
        );

      if (imageRef.current) {
        gsap.to(imageRef.current, {
          yPercent: 12,
          ease: "none",

          scrollTrigger: {
            trigger: ".hero-image-wrap",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      gsap.from(".editorial-section-heading", {
        opacity: 0,
        y: 50,
        stagger: 0.15,

        scrollTrigger: {
          trigger: ".article-content",
          start: "top 75%",
        },
      });

      gsap.from(".gallery-item", {
        opacity: 0,
        y: 50,
        stagger: 0.12,

        scrollTrigger: {
          trigger: ".gallery-grid",
          start: "top 85%",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [post]);

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808]" />
    );
  }

  /* =========================================
     NOT FOUND
  ========================================= */

  if (!post) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-orange-500 text-xs tracking-[0.4em] uppercase mb-5">
            Kutti Story Journal
          </p>

          <h1 className="text-4xl md:text-6xl font-bold">
            Story Not Found
          </h1>

          <p className="text-zinc-500 mt-5">
            This article is unavailable or unpublished.
          </p>

          <button
            onClick={() => router.push("/blog")}
            className="mt-8 border border-white/20 px-7 py-4 text-xs tracking-[0.25em] uppercase hover:bg-white hover:text-black transition-all"
          >
            Back to Journal
          </button>
        </div>
      </main>
    );
  }

  const formattedContent = formatBlogContent(
    post.content
  );

  return (
    <main
      ref={containerRef}
      className="min-h-screen bg-[#080808] text-white overflow-hidden"
    >
      {/* =====================================
          EDITORIAL HERO
      ====================================== */}

      <section className="pt-28 md:pt-36 px-6 md:px-10 lg:px-16">
        <div className="max-w-[1500px] mx-auto">

          {/* BACK */}

          <button
            onClick={() => router.push("/blog")}
            className="inline-flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase text-zinc-400 hover:text-white transition-colors mb-16"
          >
            <span className="w-10 h-px bg-orange-500" />
            Back to Journal
          </button>

          {/* TOP LABEL */}

          <div className="journal-label flex items-center gap-5 mb-10">
            <span className="text-orange-500 text-[10px] md:text-xs font-bold tracking-[0.45em] uppercase">
              {post.category || "Photography Journal"}
            </span>

            <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* TITLE */}

          <h1
            itemProp="headline"
            className="blog-title max-w-[1300px] text-[15vw] sm:text-7xl md:text-8xl lg:text-[9.5rem] xl:text-[11rem] font-bold tracking-[-0.07em] leading-[0.82]"
          >
            {post.title}
          </h1>

          {/* META */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 mt-16 md:mt-24 pb-12">
            <div className="blog-meta">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-3">
                Written By
              </p>

              <p className="text-sm md:text-base">
                {post.author_name ||
                  "Kutti Story Photography"}
              </p>
            </div>

            <div className="blog-meta">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-3">
                Published
              </p>

              <p className="font-mono text-xs md:text-sm">
                {formatDate(
                  post.published_at ||
                    post.created_at
                )}
              </p>
            </div>

            <div className="blog-meta">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-3">
                Reading Time
              </p>

              <p className="font-mono text-xs md:text-sm">
                {estimateReadTime(post.content)}
              </p>
            </div>

            <div className="blog-meta flex md:justify-end items-end">
              <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600">
                Kutti Story Journal
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          HERO IMAGE
      ====================================== */}

      {post.cover_image?.trim() ? (
        <section className="hero-image-wrap relative h-[55vh] md:h-[80vh] overflow-hidden">
          <div
            ref={imageRef}
            className="absolute inset-0 -top-[8%] h-[116%]"
          >
            <Image
              src={toImageUrl(
                post.cover_image,
                2200
              )}
              alt={
                post.image_alt ||
                post.title
              }
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* DARK GRADIENT */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/60 via-transparent to-transparent" />

          {/* MAGAZINE LABEL */}

          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/70">
              A Story By Kutti Story Photography
            </p>
          </div>
        </section>
      ) : (
        <section className="h-[35vh] bg-zinc-900 flex items-center justify-center">
          <p className="text-zinc-600 text-xs tracking-[0.3em] uppercase">
            Kutti Story Journal
          </p>
        </section>
      )}

      {/* =====================================
          ARTICLE INTRO
      ====================================== */}

      <section className="px-6 md:px-10 lg:px-16 pt-20 md:pt-32">
        <div className="max-w-[1500px] mx-auto grid lg:grid-cols-[220px_minmax(0,1fr)] gap-10 lg:gap-20">

          {/* SIDE EDITORIAL LABEL */}

          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 mb-6">
                The Story
              </p>

              <div className="w-px h-32 bg-orange-500/70" />
            </div>
          </aside>

          {/* CONTENT */}

          <article
            itemScope
            itemType="https://schema.org/BlogPosting"
            className="article-content max-w-4xl"
          >
            {post.excerpt && (
              <p className="article-lead">
                {post.excerpt}
              </p>
            )}

            <div
              itemProp="articleBody"
              className="magazine-prose"
              dangerouslySetInnerHTML={{
                __html: formattedContent,
              }}
            />
          </article>
        </div>
      </section>

      {/* =====================================
          GALLERY
      ====================================== */}

      {Array.isArray(post.galleryImages) &&
        post.galleryImages.length > 0 && (
          <section className="px-6 md:px-10 lg:px-16 py-28 md:py-40">
            <div className="max-w-[1500px] mx-auto">

              <div className="flex items-end justify-between mb-12 md:mb-16">
                <div>
                  <p className="text-orange-500 text-[9px] tracking-[0.4em] uppercase mb-4">
                    Visual Story
                  </p>

                  <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
                    Frames from the story.
                  </h2>
                </div>

                <p className="hidden md:block text-zinc-600 text-xs">
                  {String(post.galleryImages.length).padStart(
                    2,
                    "0"
                  )} Images
                </p>
              </div>

              <div className="gallery-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                {post.galleryImages.map(
                  (imgSrc, idx) => (
                    <div
                      key={idx}
                      className={`gallery-item relative overflow-hidden bg-zinc-900 ${
                        idx % 5 === 0
                          ? "md:col-span-8 aspect-[16/10]"
                          : idx % 5 === 1
                          ? "md:col-span-4 aspect-[4/5]"
                          : idx % 5 === 2
                          ? "md:col-span-5 aspect-[4/5]"
                          : idx % 5 === 3
                          ? "md:col-span-7 aspect-[16/10]"
                          : "md:col-span-12 aspect-[21/9]"
                      }`}
                    >
                      <Image
                        src={toImageUrl(
                          imgSrc,
                          1600
                        )}
                        alt={`${post.title} – Image ${
                          idx + 1
                        }`}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 60vw"
                        className="object-cover transition-transform duration-1000 hover:scale-105"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}

      {/* =====================================
          AUTHOR / BRAND SECTION
      ====================================== */}

      <section className="px-6 md:px-10 lg:px-16 pb-28 md:pb-40">
        <div className="max-w-[1500px] mx-auto border-t border-white/10 pt-16 md:pt-24">

          <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-24">

            <div>
              <p className="text-orange-500 text-[9px] tracking-[0.4em] uppercase">
                About the Studio
              </p>
            </div>

            <div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95]">
                Every wedding has a story worth remembering.
              </h2>

              <p className="max-w-2xl text-zinc-400 text-lg md:text-xl leading-relaxed mt-10">
                Kutti Story Photography creates
                cinematic photographs and films that
                preserve emotion, connection and the
                little moments that make every story
                unique.
              </p>

              <button
                onClick={() =>
                  router.push("/contact-us")
                }
                className="mt-10 inline-flex items-center gap-5 text-xs font-bold tracking-[0.25em] uppercase group"
              >
                Plan Your Story

                <span className="w-10 h-px bg-orange-500 group-hover:w-16 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          FINAL MAGAZINE CTA
      ====================================== */}

      <section className="bg-[#e9e4dc] text-[#171411] px-6 md:px-10 lg:px-16 py-24 md:py-36">
        <div className="max-w-[1500px] mx-auto text-center">

          <p className="text-[9px] font-bold tracking-[0.5em] uppercase opacity-50 mb-8">
            The Kutti Story Journal
          </p>

          <button
            onClick={() =>
              router.push("/blog")
            }
            className="group relative inline-block"
          >
            <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] font-bold tracking-[-0.07em] leading-none">
              More Stories
            </span>

            <span className="mt-5 block text-sm tracking-[0.3em] uppercase">
              Explore the Journal →
            </span>

            <span className="absolute -bottom-3 left-0 h-px w-full bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </button>
        </div>
      </section>

      {/* =====================================
          MAGAZINE ARTICLE STYLES
      ====================================== */}

      <style jsx global>{`

        .article-lead {
          font-size: clamp(1.8rem, 3vw, 3.2rem);
          line-height: 1.25;
          font-weight: 400;
          letter-spacing: -0.04em;
          color: #f4f4f5;
          margin-bottom: 5rem;
          max-width: 1000px;
        }

        .magazine-prose {
          color: #a1a1aa;
        }

        .magazine-prose p {
          font-size: clamp(1.05rem, 1.4vw, 1.35rem);
          line-height: 1.9;
          margin-bottom: 2rem;
          max-width: 850px;
          color: #a1a1aa;
        }

        .magazine-prose > p:first-child::first-letter {
          float: left;
          font-size: 5.5rem;
          line-height: 0.8;
          padding-right: 0.7rem;
          padding-top: 0.2rem;
          color: #f97316;
          font-weight: 700;
        }

        .magazine-prose h2 {
          font-size: clamp(2.5rem, 5vw, 5.5rem);
          line-height: 0.9;
          letter-spacing: -0.06em;
          color: white;
          font-weight: 700;
          margin-top: 6rem;
          margin-bottom: 2rem;
        }

        .magazine-prose h3 {
          font-size: clamp(1.7rem, 3vw, 3rem);
          line-height: 1;
          letter-spacing: -0.04em;
          color: white;
          font-weight: 700;
          margin-top: 4rem;
          margin-bottom: 1.5rem;
        }

        .magazine-prose img {
          width: 100%;
          height: auto;
          display: block;
          margin: 4rem 0;
        }

        .magazine-prose blockquote {
          border-left: 2px solid #f97316;
          padding-left: 2rem;
          margin: 5rem 0;
          font-size: clamp(1.5rem, 3vw, 3rem);
          line-height: 1.2;
          letter-spacing: -0.04em;
          color: white;
        }

        .magazine-prose ul,
        .magazine-prose ol {
          margin: 3rem 0;
          padding-left: 1.5rem;
        }

        .magazine-prose li {
          margin-bottom: 1rem;
          font-size: 1.1rem;
          line-height: 1.8;
        }

        .editorial-section-heading {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 1.5rem;
          align-items: start;
          margin-top: 7rem;
          margin-bottom: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.12);
        }

        .editorial-section-heading .section-number {
          color: #f97316;
          font-size: 0.7rem;
          font-family: monospace;
          letter-spacing: 0.15em;
          padding-top: 0.5rem;
        }

        .editorial-section-heading h2 {
          margin: 0 !important;
          font-size: clamp(2.2rem, 5vw, 5rem) !important;
          line-height: 0.9 !important;
          text-transform: uppercase;
        }

        @media (max-width: 640px) {

          .article-lead {
            font-size: 1.7rem;
            margin-bottom: 3rem;
          }

          .editorial-section-heading {
            grid-template-columns: 45px 1fr;
            gap: 1rem;
            margin-top: 4rem;
          }

          .magazine-prose > p:first-child::first-letter {
            font-size: 4.5rem;
          }

        }

      `}</style>
    </main>
  );
}