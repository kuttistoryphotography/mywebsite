/* components/blog/blogpost.tsx */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Instagram,
  X,
} from "lucide-react";
import { toImageUrl } from "@/lib/media";

type GalleryStory = {
  label?: string;
  title?: string;
  text?: string;
};

type BlogPostData = {
  id: number | string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author_name: string;
  cover_image: string;
  gallery_images?: string[];
  gallery_stories?: GalleryStory[];
  image_alt: string;
  category: string;
  tags?: string[];
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  published_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeBlog = (blog: any): BlogPostData | null => {
  if (!blog) return null;

  return {
    ...blog,
    id: blog.id ?? blog._id ?? "",
    slug: blog.slug || "",
    title: blog.title || "Untitled Story",
    excerpt: blog.excerpt || "",
    content: blog.content || "",
    author_name: blog.author_name || "Kutti Story Photography",
    cover_image: blog.cover_image || "",
    gallery_images: Array.isArray(blog.gallery_images)
      ? blog.gallery_images
      : [],
    gallery_stories: Array.isArray(blog.gallery_stories)
      ? blog.gallery_stories
      : [],
    image_alt: blog.image_alt || blog.title || "Kutti Story Photography",
    category: blog.category || "Wedding Stories",
    tags: Array.isArray(blog.tags) ? blog.tags : [],
    created_at: blog.created_at || blog.createdAt,
    published_at: blog.published_at || blog.publishedAt || null,
  };
};

const estimateReadTime = (html = "") => {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = text ? text.split(" ").length : 0;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BlogPost({
  blog: initialBlog,
}: {
  blog?: BlogPostData | null;
}) {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const containerRef = useRef<HTMLElement | null>(null);

  const [post, setPost] = useState<BlogPostData | null>(
    () => normalizeBlog(initialBlog)
  );
  const [loading, setLoading] = useState(!initialBlog);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialBlog) {
      setPost(normalizeBlog(initialBlog));
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadPost = async () => {
      try {
        if (!params?.slug) {
          if (mounted) setPost(null);
          return;
        }

        const res = await fetch(`/api/blog/slug/${params.slug}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (mounted) setPost(null);
          return;
        }

        const data = await res.json();

        if (mounted) {
          setPost(normalizeBlog(data.blog));
        }
      } catch (error) {
        console.error("Failed to fetch blog post", error);
        if (mounted) setPost(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPost();

    return () => {
      mounted = false;
    };
  }, [initialBlog, params?.slug]);

  const gallery = useMemo(() => {
    if (!post) return [];

    const images = [
      post.cover_image,
      ...(post.gallery_images || []),
    ].filter(
      (image): image is string =>
        Boolean(image && image.trim())
    );

    return Array.from(new Set(images));
  }, [post]);

  useEffect(() => {
    if (!post || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".magazine-kicker, .magazine-title, .magazine-meta",
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.08,
          ease: "power4.out",
        }
      );

      gsap.fromTo(
        ".magazine-hero-image",
        { scale: 1.12 },
        {
          scale: 1,
          duration: 1.8,
          ease: "expo.out",
        }
      );

      gsap.utils
        .toArray<HTMLElement>(".reveal-block")
        .forEach((element) => {
          gsap.fromTo(
            element,
            { y: 45, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: element,
                start: "top 88%",
                once: true,
              },
            }
          );
        });
    }, containerRef);

    return () => ctx.revert();
  }, [post]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }

      if (event.key === "ArrowRight" && gallery.length) {
        setLightboxIndex(
          (index) =>
            index === null ? 0 : (index + 1) % gallery.length
        );
      }

      if (event.key === "ArrowLeft" && gallery.length) {
        setLightboxIndex(
          (index) =>
            index === null
              ? 0
              : (index - 1 + gallery.length) % gallery.length
        );
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, gallery.length]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      // Clipboard can be unavailable in some browsers.
    }
  };

  const shareInstagram = () => {
    window.open(
      "https://www.instagram.com/",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openLightbox = (index: number) => {
    if (!gallery.length) return;
    setLightboxIndex(index);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111] text-[#f5f2eb]">
        <div className="text-center">
          <div className="mx-auto mb-5 h-px w-24 animate-pulse bg-[#111]" />
          <p className="text-[10px] uppercase tracking-[0.45em]">
            Loading story
          </p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111] px-6 text-[#f5f2eb]">
        <div className="max-w-md text-center">
          <p className="mb-5 text-[10px] uppercase tracking-[0.45em]">
            404 / Story unavailable
          </p>

          <h1 className="font-serif text-5xl tracking-tight">
            This story could not be found.
          </h1>

          <button
            onClick={() => router.push("/blog")}
            className="mt-8 inline-flex items-center gap-3 border border-[#111] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] transition hover:bg-[#111] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to journal
          </button>
        </div>
      </main>
    );
  }

  const date = formatDate(
    post.published_at ||
      post.created_at ||
      post.createdAt
  );

  const readTime = estimateReadTime(post.content);

  return (
    <main
      ref={containerRef}
      className="min-h-screen bg-[#111] text-[#f5f2eb] selection:bg-[#b9975b] selection:text-white"
    >
      <style jsx global>{`
        .magazine-serif {
          font-family: Georgia, "Times New Roman", serif;
        }

        /* =========================================================
          EDITORIAL ARTICLE
        ========================================================= */

        .article-copy {
          color: rgba(245, 242, 235, 0.78);
        }

        .article-copy > p {
          max-width: 760px;
          margin: 0 auto 1.8rem;
          font-size: 1.13rem;
          line-height: 1.95;
        }

        .article-copy > p:first-child::first-letter {
          float: left;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 5.2rem;
          line-height: 0.78;
          padding: 0.1rem 0.65rem 0 0;
          color: #f5f2eb;
        }

        .article-copy h1,
        .article-copy h2,
        .article-copy h3 {
          max-width: 900px;
          margin: 5.5rem auto 1.5rem;
          font-family: Georgia, "Times New Roman", serif;
          line-height: 0.98;
          letter-spacing: -0.035em;
          color: #f5f2eb;
        }

        .article-copy h1 {
          font-size: clamp(2.4rem, 6vw, 5.5rem);
        }

        .article-copy h2 {
          font-size: clamp(2rem, 5vw, 4rem);
        }

        .article-copy h3 {
          font-size: clamp(1.5rem, 3vw, 2.5rem);
        }

        .article-copy strong,
        .article-copy b {
          color: #f5f2eb;
        }

        .article-copy ul,
        .article-copy ol {
          max-width: 760px;
          margin: 2rem auto;
          padding-left: 1.5rem;
          line-height: 1.9;
        }

        .article-copy li {
          margin-bottom: 0.7rem;
        }

        .article-copy a {
          color: #f5f2eb;
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-color: rgba(185, 151, 91, 0.8);
        }

        .article-copy blockquote {
          max-width: 900px;
          margin: 5rem auto;
          padding: 2rem 0 2rem 2rem;
          border-left: 1px solid #b9975b;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(1.7rem, 3.5vw, 3rem);
          line-height: 1.18;
          color: #f5f2eb;
        }

        .article-copy img {
          display: block;
          width: 100%;
          max-width: 1200px;
          height: auto;
          margin: 5rem auto;
          object-fit: cover;
          cursor: zoom-in;
        }

        /* =========================================================
          MOBILE
        ========================================================= */

        @media (max-width: 768px) {
          .article-copy > p {
            font-size: 1.03rem;
            line-height: 1.85;
          }

          .article-copy > p:first-child::first-letter {
            font-size: 4.2rem;
          }

          .article-copy img {
            margin: 3rem auto;
          }

          .article-copy blockquote {
            margin: 3.5rem auto;
          }
        }
      `}</style>

      {/* =========================================================
          01. EDITORIAL MASTHEAD
      ========================================================= */}
      <header className="border-b border-white/10 bg-[#111] text-[#f5f2eb]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 md:px-10">
          <div className="h-10 bg-white-500"></div>
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>

          <Link
            href="/blog"
            className="magazine-serif text-xl italic md:text-2xl"
          >
            Kutti Story
          </Link>

          <span className="hidden text-[9px] uppercase tracking-[0.3em] md:block">
            Photography Journal
          </span>

          <span className="text-[9px] uppercase tracking-[0.25em] md:hidden">
            Journal
          </span>
        </div>
      </header>

      {/* =========================================================
          02. HERO / TITLE
      ========================================================= */}
      <section className="overflow-hidden bg-[#111] px-5 pb-16 pt-8 text-[#f5f2eb] sm:px-8 lg:px-12 lg:pb-24 lg:pt-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="magazine-kicker mb-8 flex items-center gap-4">
            <span className="h-px w-10 bg-[#b9975b]" />

            <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/50">
              {post.category || "Wedding Stories"}
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 className="magazine-title magazine-serif max-w-[1150px] text-[clamp(3.4rem,8vw,9rem)] font-normal leading-[0.82] tracking-[-0.055em]">
                {post.title}
              </h1>
            </div>

            <div className="magazine-meta max-w-[360px] pb-2">
              {post.excerpt && (
                <p className="text-[15px] leading-7 text-white/50">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-8 border-t text-white/50border-white/15 pt-5">
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] uppercase tracking-[0.2em] text-white/45">
                  <span>
                    By{" "}
                    {post.author_name ||
                      "Kutti Story Photography"}
                  </span>

                  {date && <span>{date}</span>}

                  <span>{readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          03. HERO PHOTOGRAPH
      ========================================================= */}
      {post.cover_image && (
        <section className="px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1500px]">
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="group relative block w-full cursor-zoom-in overflow-hidden bg-black text-left"
              aria-label="Open cover photograph"
            >
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={toImageUrl(post.cover_image, 2600)}
                  alt={
                    post.image_alt ||
                    post.title ||
                    "Wedding photograph by Kutti Story Photography"
                  }
                  fill
                  priority
                  unoptimized
                  sizes="100vw"
                  className="magazine-hero-image object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.025]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                <span className="absolute bottom-5 left-5 bg-white/90 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.25em] text-[#111] backdrop-blur-sm">
                  Cover Photograph
                </span>

                <span className="absolute bottom-5 right-5 text-[9px] uppercase tracking-[0.25em] text-white/80">
                  01 /{" "}
                  {String(gallery.length).padStart(2, "0")}
                </span>
              </div>
            </button>

            <div className="mt-3 flex justify-between gap-5 text-[9px] uppercase tracking-[0.2em] text-white/40">
              <span>{post.title}</span>
              <span>Kutti Story Photography</span>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          04. SOCIAL RAIL
      ========================================================= */}
      <div className="fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        <button
          onClick={copyLink}
          aria-label="Copy link"
          className="grid h-10 w-10 place-items-center rounded-full border text-white/50border-white/15 bg-[#f5f2eb]/90 backdrop-blur transition hover:bg-black hover:text-white"
        >
          {copied ? (
            <span className="text-[8px] font-bold">
              OK
            </span>
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={shareInstagram}
          aria-label="Instagram"
          className="grid h-10 w-10 place-items-center rounded-full border text-white/50border-white/15 bg-[#f5f2eb]/90 backdrop-blur transition hover:bg-black hover:text-white"
        >
          <Instagram className="h-4 w-4" />
        </button>
      </div>

      {/* =========================================================
          05. ARTICLE
      ========================================================= */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-10 md:py-32">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-[160px_minmax(0,760px)] md:justify-center md:gap-20">
          <aside className="reveal-block hidden md:block">
            <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/35">
              Story
            </p>

            <p className="magazine-serif mt-3 text-5xl">
              01
            </p>

            <div className="mt-6 h-24 w-px bg-white/15" />

            <p className="mt-6 text-[9px] uppercase leading-relaxed tracking-[0.2em] text-white/35">
              A visual journal by Kutti Story Photography
            </p>
          </aside>

          <article className="reveal-block min-w-0">
            <div
              className="article-copy"
              itemScope
              itemType="https://schema.org/BlogPosting"
            >
              <div
                itemProp="articleBody"
                dangerouslySetInnerHTML={{
                  __html: post.content,
                }}
              />
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          06. PHOTO ESSAY
      ========================================================= */}
      {post.gallery_images?.length ? (
        <section className="bg-[#0d0d0d] px-5 py-20 text-[#f5f2eb] md:px-10 md:py-32">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-16 grid gap-8 md:grid-cols-[1fr_1fr] md:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#b9975b]">
                  02 / Photo essay
                </p>

                <h2 className="magazine-serif mt-4 text-5xl leading-[0.9] tracking-[-0.04em] md:text-8xl">
                  Frames
                  <br />
                  from the story.
                </h2>
              </div>

              <p className="max-w-xl text-sm leading-7 text-white/55 md:justify-self-end">
                Every photograph holds a small piece of
                the day. Explore the moments, details and
                in-between frames that shaped this story.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-8">
              {post.gallery_images.map(
                (image, index) => {
                  const story =
                    post.gallery_stories?.[index];

                  const layout = index % 5;

                  const imageClass =
                    layout === 0
                      ? "md:col-span-7 md:aspect-[4/5]"
                      : layout === 1
                      ? "md:col-span-5 md:mt-24 md:aspect-[3/2]"
                      : layout === 2
                      ? "md:col-span-12 md:aspect-[21/9]"
                      : layout === 3
                      ? "md:col-span-5 md:aspect-[4/5]"
                      : "md:col-span-7 md:mt-24 md:aspect-[3/2]";

                  return (
                    <React.Fragment
                      key={`${image}-${index}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openLightbox(index + 1)
                        }
                        className={`reveal-block group relative block aspect-[4/5] overflow-hidden bg-white/5 text-left ${imageClass}`}
                      >
                        <Image
                          src={toImageUrl(image, 2200)}
                          alt={`${post.title} — image ${
                            index + 1
                          }`}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 70vw"
                          className="object-cover transition duration-1000 group-hover:scale-[1.035]"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-80" />

                        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                          <span className="text-[9px] uppercase tracking-[0.3em]">
                            Frame{" "}
                            {String(index + 1).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <span className="text-[9px] uppercase tracking-[0.25em] text-white/60">
                            Expand
                          </span>
                        </div>
                      </button>

                      {story &&
                      (story.title || story.text) ? (
                        <div
                          className={`reveal-block flex flex-col justify-center py-8 md:col-span-5 md:px-8 ${
                            index % 2
                              ? "md:col-start-1"
                              : ""
                          }`}
                        >
                          {story.label && (
                            <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#b9975b]">
                              {story.label}
                            </p>
                          )}

                          {story.title && (
                            <h3 className="magazine-serif mt-4 text-4xl leading-[0.95] tracking-[-0.03em] md:text-6xl">
                              {story.title}
                            </h3>
                          )}

                          {story.text && (
                            <p className="mt-5 text-sm leading-7 text-white/55">
                              {story.text}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </React.Fragment>
                  );
                }
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* =========================================================
          07. CLOSING CTA
      ========================================================= */}
      <section className="bg-[#111] px-5 py-24 text-[#f5f2eb] md:px-10 md:py-40">
        <div className="mx-auto max-w-[1200px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.45em]">
            03 / The closing frame
          </p>

          <h2 className="magazine-serif mx-auto mt-7 max-w-5xl text-5xl leading-[0.88] tracking-[-0.05em] md:text-8xl">
            The photographs end.
            <br />
            The memories don&apos;t.
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-white/50">
            Your story deserves more than a collection of
            images. It deserves an editorial that feels as
            unforgettable as the day itself.
          </p>

          <Link
            href="/contact-us"
            className="mt-10 inline-flex items-center gap-4 border border-white/30 px-7 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition hover:border-[#b9975b] hover:bg-[#b9975b] hover:text-black"
          >
            Tell Your Story
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* =========================================================
          08. FOOTER
      ========================================================= */}
      <footer className="bg-[#111] px-5 py-16 text-[#f5f2eb] md:px-10 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col gap-8 border-b text-white/50border-white/15 pb-12 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/35">
                Keep reading
              </p>

              <h3 className="magazine-serif mt-3 text-4xl tracking-[-0.03em] md:text-6xl">
                More stories from Kutti Story.
              </h3>
            </div>

            <Link
              href="/blog"
              className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em]"
            >
              View all stories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex items-center justify-between pt-8 text-[9px] uppercase tracking-[0.25em] text-white/35">
            <span>
              © {new Date().getFullYear()} Kutti Story
              Photography
            </span>

            <span className="hidden sm:block">
              Made for stories worth remembering
            </span>
          </div>
        </div>
      </footer>

      {/* =========================================================
          09. LIGHTBOX
      ========================================================= */}
      {lightboxIndex !== null &&
        gallery[lightboxIndex] && (
          <div
            className="fixed inset-0 z-[200] bg-black/95 p-4 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-black"
              aria-label="Close photo viewer"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={() =>
                setLightboxIndex(
                  (index) =>
                    index === null
                      ? 0
                      : (index - 1 + gallery.length) %
                        gallery.length
                )
              }
              className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-black md:left-8"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={() =>
                setLightboxIndex(
                  (index) =>
                    index === null
                      ? 0
                      : (index + 1) % gallery.length
                )
              }
              className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-black md:right-8"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="relative h-full w-full">
              <Image
                src={toImageUrl(
                  gallery[lightboxIndex],
                  3000
                )}
                alt={`${post.title} — photo ${
                  lightboxIndex + 1
                }`}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
            </div>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.3em] text-white/60">
              {String(lightboxIndex + 1).padStart(2, "0")} /{" "}
              {String(gallery.length).padStart(2, "0")}
            </div>
          </div>
        )}
    </main>
  );
}
