"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { toImageUrl } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger);

const estimateReadTime = (html = "") => {
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function BlogCard({ post, onClick }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = post.image && post.image.trim() !== "" && !imgError;

  return (
    <div className="blog-card group cursor-pointer" onClick={onClick}>
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden rounded-2xl mb-6 bg-zinc-900">
        {hasImage ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 19.5h18M3 4.5h18" />
            </svg>
          </div>
        )}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase z-10">
          {post.category}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-zinc-500 text-xs font-mono">
          <span>{post.date}</span>
          <span className="w-1 h-1 bg-zinc-700 rounded-full" />
          <span>{post.readTime}</span>
        </div>
        <h3 className="text-2xl font-bold leading-snug group-hover:text-orange-500 transition-colors duration-300">
          {post.title}
        </h3>
        <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">{post.excerpt}</p>
        <div className="pt-2 flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
          Read Article <span className="text-orange-500">→</span>
        </div>
      </div>
    </div>
  );
}

const BlogSection = () => {
  const sectionRef = useRef(null);
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".blog-card", {
        opacity: 0,
        y: 50,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".blog-grid",
          start: "top 85%",
        },
      });
    });
    return () => ctx.revert();
  }, [blogs]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/blog?status=published&limit=3");
        if (!mounted) return;

        if (!res.ok) {
          setBlogs([]);
          return;
        }

        const data = await res.json();
        const posts = Array.isArray(data.blogs) ? data.blogs : [];

        setBlogs(
          posts.map((post) => ({
            id:       post.id,
            slug:     post.slug,
            date:     formatDate(post.published_at || post.created_at),
            readTime: estimateReadTime(post.content || ""),
            category: post.category || "General",
            title:    post.title,
            excerpt:  post.excerpt || "",
            image:    post.cover_image && post.cover_image.trim() !== "" ? toImageUrl(post.cover_image, 800) : "",
          }))
        );
      } catch (error) {
        console.error("Failed to fetch blogs", error);
        if (mounted) setBlogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <section ref={sectionRef} className="bg-black py-24 px-6 md:px-16 text-white">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <p className="text-orange-500 font-mono text-xs tracking-[0.4em] uppercase mb-4">The Journal</p>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">Photography <br />Insights</h2>
          </div>
          <button
            onClick={() => router.push("/blog")}
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 border-b border-zinc-800 pb-2"
          >
            VIEW ALL STORIES <span>→</span>
          </button>
        </div>

        {/* BLOG GRID */}
        <div className="blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {blogs.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              onClick={() => router.push(`/blog/${post.slug}`)}
            />
          ))}

          {!loading && blogs.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-10 text-center">
              <h3 className="text-xl font-semibold">No blog posts published yet</h3>
              <p className="text-zinc-500 mt-2">Publish posts from admin content panel to show them here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;