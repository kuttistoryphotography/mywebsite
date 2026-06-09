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
      {/* --- MINIMALIST NAV --- */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all"
        >
          <span className="w-8 h-px bg-white group-hover:w-12 transition-all" /> BACK
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

          <h1 className="blog-title text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.85] text-balance">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-12 pt-12">
            <div className="meta-item">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">Author</p>
              <p className="font-medium">{post.author_name || "Kutti Story Team"}</p>
            </div>
            <div className="meta-item">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">Published</p>
              <p className="font-mono text-sm">{formatDate(post.published_at || post.created_at)}</p>
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
              alt={post.title}
              fill
              className="object-cover brightness-90"
              priority
              unoptimized
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

      {/* --- CONTENT --- */}
      <section className="py-24 px-6">
        <article className="max-w-3xl mx-auto">
          <div className="prose prose-invert max-w-none">
            <style>{`
              .prose p { font-size: 1.25rem; line-height: 1.7; color: #a1a1aa; margin-bottom: 2rem; font-weight: 300; }
              .prose h3 { font-size: 2.5rem; font-weight: 700; color: white; margin-top: 4rem; letter-spacing: -0.05em; }
              .prose ul { padding-left: 0; margin: 3rem 0; }
              .prose li { list-style: none; font-size: 1.1rem; padding: 1.5rem 0; border-top: 1px solid #27272a; color: #d4d4d8; }
              .prose li:before { content: '0' counter(list-item) '.'; margin-right: 1rem; color: #f97316; font-family: monospace; }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* --- ENHANCED GALLERY --- */}
          {Array.isArray((post as any).galleryImages) && (post as any).galleryImages.length > 0 && (
            <div className="gallery-grid my-32 space-y-4">
              <h3 className="text-xs font-bold tracking-[0.5em] uppercase text-zinc-600 mb-12 block text-center">Visual Narrative</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(post as any).galleryImages.map((imgSrc: string, idx: number) => (
                  <div
                    key={idx}
                    className={`gallery-item relative overflow-hidden bg-zinc-900 group ${
                      idx % 3 === 0 ? "md:col-span-2 aspect-video" : "aspect-4/5"
                    }`}
                  >
                    <Image
                      src={imgSrc || "/placeholder.svg"}
                      alt="Gallery image"
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- AUTHOR CARD --- */}
          <footer className="mt-32 p-12 bg-zinc-950 border border-zinc-900 rounded-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
              <div className="w-20 h-20 bg-orange-500 rounded-full shrink-0 flex items-center justify-center font-bold text-black text-2xl">
                KS
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">About Kutti Story</h4>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Crafting cinematic visuals and timeless memories. Specializing in high-end photography
                  that blends traditional storytelling with modern aesthetics.
                </p>
                <button className="text-orange-500 text-[10px] font-bold tracking-[0.3em] uppercase border-b border-orange-500/20 pb-2 hover:border-orange-500 transition-all">
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