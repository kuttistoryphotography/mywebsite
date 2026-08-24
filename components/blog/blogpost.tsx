"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { toImageUrl } from "@/lib/media";

type BlogPostData = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author_name: string;

  cover_image: string;
  gallery_images: string[];
    gallery_stories?: {
    label: string;
    title: string;
    text: string;
  }[];
  image_alt: string;

  category: string;
  tags?: string[];
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  published_at: string | null;
};

const estimateReadTime = (html = "") => {
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
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

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const getGalleryStory = (index: number) => {
    return post?.gallery_stories?.[index] || {
      label: "",
      title: "",
      text: "",
    };
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!params?.slug) {
          if (mounted) setPost(null);
          return;
        }

        const res = await fetch(`/api/blog/slug/${params.slug}`);
        if (!mounted) return;

        if (!res.ok) {
          setPost(null);
          return;
        }

        const data = await res.json();
        setPost(data.blog || null);
      } catch (error) {
        console.error("Failed to fetch blog post", error);
        if (mounted) setPost(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!post) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // 1. Entrance Animation
      tl.from(".animate-line", { width: 0, duration: 1.5, stagger: 0.2 })
        .from(".blog-title", { y: 100, opacity: 0, duration: 1.2 }, "-=1")
        .from(".meta-item", { opacity: 0, y: 20, stagger: 0.1, duration: 0.8 }, "-=0.8")
        .from(".hero-image-wrap", { scale: 1.2, duration: 2, ease: "expo.out" }, "-=1.5");

      // 2. Parallax effect on Featured Image
      gsap.to(imageRef.current, {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-image-wrap",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      // 3. Staggered reveal for gallery
      gsap.from(".gallery-item", {
        opacity: 0,
        y: 50,
        rotation: 2,
        stagger: 0.15,
        scrollTrigger: {
          trigger: ".gallery-grid",
          start: "top 80%",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [post]);

  if (loading) return <div className="bg-black min-h-screen" />;

  if (!post) {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Post not found</h1>
          <p className="text-zinc-500 mt-2">This blog post is unavailable or unpublished.</p>
          <button
            onClick={() => router.push("/blog")}
            className="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black rounded-xl font-semibold transition-colors"
          >
            Back to Blog
          </button>
        </div>
      </main>
    );
  }

  return (
    <main ref={containerRef} className="bg-black text-white min-h-screen selection:bg-orange-500 selection:text-black">
      {/* --- BACK BUTTON --- */}
      <nav className="fixed top-20 left-0 w-full z-[100] px-6 md:px-12 pointer-events-none">
        <button
          onClick={() => router.back()}
          className="pointer-events-auto group flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase text-white bg-black/70 backdrop-blur-md px-5 py-4 rounded-full border border-white/10 hover:border-orange-500/50 transition-all"
        >
          <span className="w-8 h-px bg-white group-hover:w-12 group-hover:bg-orange-500 transition-all" />
          BACK
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <span className="text-orange-500 text-xs font-bold tracking-[0.2em] uppercase">
              {post.category}
            </span>
            <div className="animate-line h-px flex-1 bg-zinc-800" />
          </div>

          <h1
            itemProp="headline"
            className="blog-title text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.85] text-balance"
          >
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-12 pt-12">
            <div className="meta-item">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">Author</p>
              <div itemProp="author" itemScope itemType="https://schema.org/Organization">
                <p itemProp="name" className="font-medium">
                  {post.author_name || "Kutti Story Photography"}
                </p>
              </div>
            </div>
            <div className="meta-item">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">Published</p>
              <p
                itemProp="datePublished"
                className="font-mono text-sm"
              >
                {formatDate(post.published_at || post.created_at)}
              </p>
            </div>
            <div className="meta-item">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">Reading Time</p>
              <p className="font-mono text-sm">{estimateReadTime(post.content)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURED IMAGE (PARALLAX) --- */}
      {post.cover_image && post.cover_image.trim() !== "" ? (
        <section className="hero-image-wrap relative w-full h-[70vh] md:h-[90vh] overflow-hidden">
          <div ref={imageRef} className="absolute inset-0 w-full h-[120%]">
            <Image
              src={toImageUrl(post.cover_image, 2000)}
              alt={post.image_alt || post.title}
              itemProp="image"
              fill
              className="object-cover brightness-90"
              priority
              
            />
          </div>
        </section>
      ) : (
        <section className="hero-image-wrap relative w-full h-[30vh] bg-zinc-900 flex items-center justify-center">
          <svg className="w-16 h-16 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 19.5h18M3 4.5h18" />
          </svg>
        </section>
      )}

      {/* --- MAGAZINE CONTENT --- */}
      <section className="py-20 md:py-32 px-6">
        <article
          className="max-w-5xl mx-auto"
          itemScope
          itemType="https://schema.org/BlogPosting"
        >
          <div className="blog-magazine-content">
            <style>{`
              .blog-magazine-content {
                max-width: 100%;
              }

              /* Text */
              .blog-magazine-content p {
                max-width: 760px;
                margin: 0 auto 2rem;
                font-size: 1.15rem;
                line-height: 1.9;
                color: #a1a1aa;
                font-weight: 300;
              }

              /* First paragraph */
              .blog-magazine-content > p:first-child,
              .blog-magazine-content .lead {
                font-size: 1.45rem;
                line-height: 1.8;
                color: #d4d4d8;
              }

              /* Headings */
              .blog-magazine-content h1,
              .blog-magazine-content h2,
              .blog-magazine-content h3 {
                max-width: 900px;
                margin: 5rem auto 1.5rem;
                color: white;
                font-weight: 700;
                letter-spacing: -0.04em;
                line-height: 1.05;
              }

              .blog-magazine-content h2 {
                font-size: clamp(2rem, 5vw, 4rem);
              }

              .blog-magazine-content h3 {
                font-size: clamp(1.5rem, 3vw, 2.5rem);
              }

              /* Lists */
              .blog-magazine-content ul,
              .blog-magazine-content ol {
                max-width: 760px;
                margin: 2.5rem auto;
                padding-left: 1.5rem;
                color: #d4d4d8;
              }

              .blog-magazine-content li {
                margin-bottom: 1rem;
                line-height: 1.8;
              }

              /* MAGAZINE IMAGES */
              .blog-magazine-content img {
                display: block;
                width: 100%;
                height: auto;
                max-width: 100%;
                object-fit: cover;
                margin: 5rem auto;
                border-radius: 2px;
              }

              /* Image 1 - Full cinematic width */
              .blog-magazine-content img:nth-of-type(1) {
                width: min(100%, 1200px);
                aspect-ratio: 16 / 9;
                object-fit: cover;
              }

              /* Image 2 - Portrait editorial */
              .blog-magazine-content img:nth-of-type(2) {
                width: min(65%, 700px);
                aspect-ratio: 4 / 5;
                object-fit: cover;
                margin-left: 0;
              }

              /* Image 3 - Wide */
              .blog-magazine-content img:nth-of-type(3) {
                width: 100%;
                aspect-ratio: 21 / 9;
                object-fit: cover;
              }

              /* Image 4 - Right aligned portrait */
              .blog-magazine-content img:nth-of-type(4) {
                width: min(60%, 650px);
                aspect-ratio: 4 / 5;
                object-fit: cover;
                margin-right: 0;
              }

              /* Image 5 - Large feature */
              .blog-magazine-content img:nth-of-type(5) {
                width: 100%;
                aspect-ratio: 3 / 2;
                object-fit: cover;
              }

              /* Image 6 - Medium centered */
              .blog-magazine-content img:nth-of-type(6) {
                width: min(75%, 850px);
                aspect-ratio: 3 / 2;
                object-fit: cover;
              }

              /* Image 7 - Portrait left */
              .blog-magazine-content img:nth-of-type(7) {
                width: min(55%, 600px);
                aspect-ratio: 4 / 5;
                object-fit: cover;
                margin-left: 0;
              }

              /* Image 8 - Full wide */
              .blog-magazine-content img:nth-of-type(8) {
                width: 100%;
                aspect-ratio: 16 / 9;
                object-fit: cover;
              }

              /* Image 9 - Right editorial */
              .blog-magazine-content img:nth-of-type(9) {
                width: min(65%, 700px);
                aspect-ratio: 4 / 5;
                object-fit: cover;
                margin-right: 0;
              }

              /* Image 10 - Final cinematic image */
              .blog-magazine-content img:nth-of-type(10) {
                width: 100%;
                aspect-ratio: 21 / 9;
                object-fit: cover;
              }

              .blog-magazine-content blockquote {
                max-width: 850px;
                margin: 5rem auto;
                padding: 2rem 0 2rem 2rem;
                border-left: 2px solid #f97316;
                font-size: clamp(1.5rem, 3vw, 2.5rem);
                line-height: 1.4;
                color: white;
              }

              /* Mobile */
              @media (max-width: 768px) {
                .blog-magazine-content p {
                  font-size: 1.05rem;
                  line-height: 1.8;
                }

                .blog-magazine-content > p:first-child {
                  font-size: 1.2rem;
                }

                .blog-magazine-content img,
                .blog-magazine-content img:nth-of-type(n) {
                  width: 100%;
                  aspect-ratio: auto;
                  margin: 3rem auto;
                }

                .blog-magazine-content h1,
                .blog-magazine-content h2,
                .blog-magazine-content h3 {
                  margin-top: 3.5rem;
                }
              }
            `}</style>

            <div
              itemProp="articleBody"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* --- BLOG PHOTO GALLERY --- */}
            {post.gallery_images && post.gallery_images.length > 0 && (
              <section className="mt-20 md:mt-32">

                {/* Gallery Title */}
                <div className="mb-16 text-center">
                  <p className="text-orange-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">
                    Photo Story
                  </p>

                  <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
                    The Gallery
                  </h2>
                </div>

                {/* IMAGE 1 + IMAGE 2 */}
                <div className="gallery-grid grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  {post.gallery_images.slice(0, 2).map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="gallery-item relative overflow-hidden bg-zinc-900 aspect-[4/5]"
                    >
                      <Image
                        src={toImageUrl(image, 1800)}
                        alt={`${post.title} - Gallery Image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>

                {/* STORY TEXT 1 */}
                {post.gallery_images.length >= 2 && (() => {
                  const story = getGalleryStory(0);

                  return (
                    <div className="my-20 md:my-32 max-w-2xl ml-auto">
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
                })()}

                {/* IMAGE 3 + IMAGE 4 */}
                {post.gallery_images.length > 2 && (
                  <div className="gallery-grid grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    {post.gallery_images.slice(2, 4).map((image, index) => (
                      <div
                        key={`${image}-${index + 2}`}
                        className={`gallery-item relative overflow-hidden bg-zinc-900 ${
                          index === 0 ? "aspect-[3/2]" : "aspect-[4/5]"
                        }`}
                      >
                        <Image
                          src={toImageUrl(image, 1800)}
                          alt={`${post.title} - Gallery Image ${index + 3}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 hover:scale-105"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* STORY TEXT 2 */}
                {post.gallery_images.length >= 4 && (() => {
                  const story = getGalleryStory(1);

                  return (
                    <div className="my-20 md:my-32 max-w-2xl">
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
                })()}

                {/* IMAGE 5 - FULL WIDTH */}
                {post.gallery_images[4] && (
                  <div className="gallery-item relative overflow-hidden bg-zinc-900 aspect-[16/9]">
                    <Image
                      src={toImageUrl(post.gallery_images[4], 2000)}
                      alt={`${post.title} - Gallery Image 5`}
                      fill
                      sizes="100vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      unoptimized
                    />
                  </div>
                )}

                {/* STORY TEXT 3 */}
                {post.gallery_images.length >= 5 && (() => {
                  const story = getGalleryStory(2);

                  return (
                    <div className="my-20 md:my-32 max-w-3xl mx-auto text-center">
                      {story.label && (
                        <span className="text-orange-500 text-xs font-bold tracking-[0.3em] uppercase">
                          {story.label}
                        </span>
                      )}

                      {story.title && (
                        <h3 className="mt-5 text-4xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
                          {story.title}
                        </h3>
                      )}

                      {story.text && (
                        <p className="mt-8 text-zinc-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                          {story.text}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* IMAGE 6 + IMAGE 7 */}
                {post.gallery_images.length > 5 && (
                  <div className="gallery-grid grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    {post.gallery_images.slice(5, 7).map((image, index) => (
                      <div
                        key={`${image}-${index + 5}`}
                        className={`gallery-item relative overflow-hidden bg-zinc-900 ${
                          index === 0 ? "aspect-[4/5]" : "aspect-[3/2]"
                        }`}
                      >
                        <Image
                          src={toImageUrl(image, 1800)}
                          alt={`${post.title} - Gallery Image ${index + 6}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 hover:scale-105"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* STORY TEXT 4 */}
                {post.gallery_images.length >= 7 && (() => {
                  const story = getGalleryStory(3);

                  return (
                    <div className="my-20 md:my-32 max-w-2xl ml-auto">
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
                })()}

                {/* IMAGE 8 + IMAGE 9 + IMAGE 10 */}
                {post.gallery_images.length > 7 && (
                  <div className="gallery-grid grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    {post.gallery_images.slice(7, 10).map((image, index) => (
                      <div
                        key={`${image}-${index + 7}`}
                        className={`gallery-item relative overflow-hidden bg-zinc-900 ${
                          index === 2
                            ? "md:col-span-2 aspect-[16/9]"
                            : index === 0
                            ? "aspect-[3/2]"
                            : "aspect-[4/5]"
                        }`}
                      >
                        <Image
                          src={toImageUrl(image, 1800)}
                          alt={`${post.title} - Gallery Image ${index + 8}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 hover:scale-105"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* FINAL STORY */}
                <div className="mt-24 md:mt-40 text-center max-w-3xl mx-auto">
                  <span className="text-orange-500 text-xs font-bold tracking-[0.3em] uppercase">
                    The End of One Chapter
                  </span>

                  <h3 className="mt-5 text-4xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
                    But the beginning of a lifetime of memories.
                  </h3>
                </div>

              </section>
            )}
          </div>

          {/* --- AUTHOR CARD --- */}
          <footer className="mt-32 p-8 md:p-12 bg-zinc-950 border border-zinc-900 rounded-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
              <div className="w-20 h-20 bg-orange-500 rounded-full shrink-0 flex items-center justify-center font-bold text-black text-2xl">
                KS
              </div>

              <div>
                <h4 className="text-xl font-bold mb-2">
                  About Kutti Story
                </h4>

                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Crafting cinematic visuals and timeless memories. Specializing in
                  high-end photography that blends traditional storytelling with
                  modern aesthetics.
                </p>

                <button
                  onClick={() => router.push("/contact-us")}
                  className="text-orange-500 text-[10px] font-bold tracking-[0.3em] uppercase border-b border-orange-500/20 pb-2 hover:border-orange-500 transition-all"
                >
                  Inquire for Shoots
                </button>
              </div>
            </div>
          </footer>
        </article>
      </section>

      {/* --- NEXT POST PREVIEW --- */}
      <section className="bg-white text-black py-32 px-6 text-center">
        <p className="text-[10px] font-black tracking-[0.5em] uppercase mb-8 opacity-40">Keep Reading</p>
        <button
          onClick={() => router.push("/blog")}
          className="group relative inline-block text-5xl md:text-8xl font-bold tracking-tighter"
        >
          View All Stories
          <span className="absolute bottom-0 left-0 w-full h-1 bg-black origin-right scale-x-0 group-hover:scale-x-100 group-hover:origin-left transition-transform duration-500" />
        </button>
      </section>
    </main>
  );
}