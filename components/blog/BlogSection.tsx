"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { toImageUrl } from "@/lib/media";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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

function MagazineCard({
  post,
  index,
  onClick,
}: {
  post: any;
  index: number;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  const hasImage =
    post.image &&
    post.image.trim() !== "" &&
    !imgError;

  /*
    Magazine layout pattern
  */

  const isLarge =
    index === 0 ||
    index === 3 ||
    index === 6 ||
    index === 9;

  return (
    <article
      onClick={onClick}
      className={`magazine-card group cursor-pointer ${
        isLarge
          ? "md:col-span-7"
          : "md:col-span-5"
      }`}
    >
      {/* IMAGE */}

      <div
        className={`relative overflow-hidden bg-zinc-900 ${
          isLarge
            ? "aspect-[16/10]"
            : "aspect-[4/3]"
        }`}
      >
        {hasImage ? (
          <Image
            src={post.image}
            alt={post.image_alt || post.title}
            fill
            sizes={
              isLarge
                ? "(max-width: 768px) 100vw, 60vw"
                : "(max-width: 768px) 100vw, 40vw"
            }
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-zinc-700 text-xs tracking-[0.3em] uppercase">
              Kutti Story Journal
            </span>
          </div>
        )}

        {/* IMAGE OVERLAY */}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700" />

        {/* NUMBER */}

        <div className="absolute top-5 left-5">
          <span className="text-[9px] tracking-[0.3em] font-mono text-white/80">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* CATEGORY */}

        <div className="absolute bottom-5 left-5">
          <span className="bg-black/50 backdrop-blur-md px-4 py-2 text-[9px] tracking-[0.25em] uppercase">
            {post.category}
          </span>
        </div>
      </div>

      {/* CONTENT */}

      <div className="pt-6">

        <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.25em] text-zinc-600 mb-4">
          <span>{post.date}</span>

          <span className="w-1 h-1 rounded-full bg-orange-500" />

          <span>{post.readTime}</span>
        </div>

        <h3
          className={`font-bold tracking-tight leading-[0.95] group-hover:text-orange-500 transition-colors duration-300 ${
            isLarge
              ? "text-4xl md:text-5xl lg:text-6xl"
              : "text-3xl md:text-4xl"
          }`}
        >
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-zinc-500 leading-relaxed mt-5 max-w-xl text-sm md:text-base">
            {post.excerpt}
          </p>
        )}

        <div className="mt-6 flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-bold">
          <span>Read Story</span>

          <span className="w-8 h-px bg-orange-500 group-hover:w-14 transition-all duration-500" />
        </div>
      </div>
    </article>
  );
}

const BlogSection = ({ limit }: { limit?: number }) => {
  const sectionRef = useRef<HTMLElement | null>(null);

  const router = useRouter();

  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  /* =========================================
     FETCH BLOGS
  ========================================= */

  useEffect(() => {
    let mounted = true;

    const fetchBlogs = async () => {
      try {
        const res = await fetch(
          "/api/blog?status=published"
        );

        if (!mounted) return;

        if (!res.ok) {
          setBlogs([]);
          return;
        }

        const data = await res.json();

        const posts = Array.isArray(data.blogs)
          ? data.blogs
          : [];

        const formattedPosts = posts.map(
          (post: any) => ({
            id: post.id,
            slug: post.slug,

            date: formatDate(
              post.published_at ||
              post.created_at ||
              post.createdAt
            ),

            readTime: estimateReadTime(
              post.content || ""
            ),

            category:
              post.category ||
              "Photography Journal",

            title: post.title,

            excerpt:
              post.excerpt ||
              "",

            image:
              post.cover_image &&
              post.cover_image.trim() !== ""
                ? toImageUrl(
                    post.cover_image,
                    1400
                  )
                : "",

            image_alt:
              post.image_alt ||
              post.title,

            featured:
              post.featured ||
              post.is_featured ||
              false,
          })
        );

        /*
          Featured post first
        */

        formattedPosts.sort(
          (a: any, b: any) =>
            Number(b.featured) -
            Number(a.featured)
        );

        setBlogs(formattedPosts);
      } catch (error) {
        console.error(
          "Failed to fetch blogs",
          error
        );

        if (mounted) {
          setBlogs([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBlogs();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================
     GSAP
  ========================================= */

  useEffect(() => {
    if (
      !sectionRef.current ||
      blogs.length === 0
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(
        ".journal-hero-animate",
        {
          y: 50,
          opacity: 0,
          stagger: 0.15,
          duration: 1.1,
          ease: "power4.out",
        }
      );

      gsap.from(
        ".magazine-card",
        {
          opacity: 0,
          y: 80,
          stagger: 0.12,
          duration: 1,
          ease: "power3.out",

          scrollTrigger: {
            trigger: ".magazine-grid",
            start: "top 85%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [blogs]);

  /* =========================================
     VISIBLE BLOGS
  ========================================= */

  let visibleBlogs = showAll
    ? blogs
    : blogs.slice(
        0,
        limit || 6
      );

  if (limit) {
    visibleBlogs = blogs.slice(0, limit);
  }

  /*
    First blog is the main featured story.
    Remaining blogs go into magazine grid.
  */

  const featuredPost =
    visibleBlogs.length > 0
      ? visibleBlogs[0]
      : null;

  const magazinePosts =
    visibleBlogs.length > 1
      ? visibleBlogs.slice(1)
      : [];

  return (
    <section
      ref={sectionRef}
      className="bg-[#080808] text-white overflow-hidden"
    >

      {/* =====================================
          JOURNAL HERO
      ====================================== */}

      <div className="px-6 md:px-10 lg:px-16 pt-28 md:pt-36 pb-20">

        <div className="max-w-[1500px] mx-auto">

          {/* TOP LABEL */}

          <div className="journal-hero-animate flex items-center gap-5 mb-10">

            <span className="text-orange-500 text-[10px] md:text-xs tracking-[0.45em] uppercase font-bold">
              Since 2018
            </span>

            <span className="h-px flex-1 bg-white/10" />

            <span className="hidden md:block text-[9px] tracking-[0.35em] uppercase text-zinc-600">
              Photography • Stories • Inspiration
            </span>

          </div>

          {/* HUGE MAGAZINE TITLE */}

          <h1 className="journal-hero-animate text-[15vw] sm:text-7xl md:text-8xl lg:text-[10rem] xl:text-[12rem] font-bold tracking-[-0.08em] leading-[0.78]">
            THE JOURNAL
          </h1>

          {/* BOTTOM TEXT */}

          <div className="journal-hero-animate grid md:grid-cols-2 gap-8 mt-14 md:mt-20">

            <p className="text-zinc-500 text-sm md:text-base max-w-md leading-relaxed">
              Stories, ideas, photography
              inspiration and practical guides
              for couples creating memories
              worth remembering.
            </p>

            <div className="md:text-right flex md:justify-end items-end">
              <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-600">
                Kutti Story Photography
              </p>
            </div>

          </div>
        </div>
      </div>


      {/* =====================================
          FEATURED STORY
      ====================================== */}

      {featuredPost && (
        <section className="px-6 md:px-10 lg:px-16 pb-24 md:pb-36">

          <div className="max-w-[1500px] mx-auto">

            {/* FEATURED LABEL */}

            <div className="flex items-center justify-between mb-8">

              <p className="text-[9px] tracking-[0.4em] uppercase text-orange-500">
                Featured Story
              </p>

              <p className="text-[9px] tracking-[0.3em] uppercase text-zinc-600">
                {featuredPost.category}
              </p>

            </div>

            <article
              onClick={() =>
                router.push(
                  `/blog/${featuredPost.slug}`
                )
              }
              className="group cursor-pointer"
            >

              {/* FEATURE IMAGE */}

              <div className="relative aspect-[16/8] md:aspect-[21/9] overflow-hidden bg-zinc-900">

                {featuredPost.image ? (
                  <Image
                    src={featuredPost.image}
                    alt={
                      featuredPost.image_alt ||
                      featuredPost.title
                    }
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-zinc-700 text-xs uppercase tracking-[0.3em]">
                      Kutti Story
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* IMAGE TEXT */}

                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">

                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/70">
                    {featuredPost.date}
                    {"  •  "}
                    {featuredPost.readTime}
                  </span>

                </div>
              </div>


              {/* FEATURE CONTENT */}

              <div className="grid lg:grid-cols-[1.6fr_0.7fr] gap-10 lg:gap-24 pt-10 md:pt-14">

                <div>

                  <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-[-0.06em] leading-[0.88] group-hover:text-orange-500 transition-colors duration-500">
                    {featuredPost.title}
                  </h2>

                </div>

                <div className="lg:pt-3">

                  <p className="text-zinc-500 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="mt-8 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em]">
                    <span>Read the Story</span>

                    <span className="w-10 h-px bg-orange-500 group-hover:w-20 transition-all duration-500" />
                  </div>

                </div>

              </div>
            </article>
          </div>
        </section>
      )}


      {/* =====================================
          LATEST STORIES TITLE
      ====================================== */}

      {magazinePosts.length > 0 && (
        <section className="px-6 md:px-10 lg:px-16 pb-16">

          <div className="max-w-[1500px] mx-auto border-t border-white/10 pt-16 md:pt-24">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

              <div>

                <p className="text-orange-500 text-[9px] tracking-[0.4em] uppercase mb-5">
                  Latest Stories
                </p>

                <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.06em] leading-none">
                  Fresh from the
                  <br />
                  journal.
                </h2>

              </div>

              {!limit && (
                <button
                  onClick={() =>
                    setShowAll(!showAll)
                  }
                  className="group inline-flex items-center gap-4 text-[10px] tracking-[0.3em] uppercase text-zinc-500 hover:text-white transition-colors"
                >
                  {showAll
                    ? "Show Less"
                    : "View All Stories"}

                  <span className="w-8 h-px bg-orange-500 group-hover:w-14 transition-all" />
                </button>
              )}

            </div>
          </div>
        </section>
      )}


      {/* =====================================
          MAGAZINE GRID
      ====================================== */}

      <section className="px-6 md:px-10 lg:px-16 pb-32 md:pb-48">

        <div className="max-w-[1500px] mx-auto">

          {loading ? (

            <div className="py-24 text-center">
              <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-600">
                Loading Stories...
              </span>
            </div>

          ) : magazinePosts.length > 0 ? (

            <div className="magazine-grid grid grid-cols-1 md:grid-cols-12 gap-x-8 lg:gap-x-12 gap-y-20 md:gap-y-28">

              {magazinePosts.map(
                (post, index) => (
                  <MagazineCard
                    key={post.id}
                    post={post}
                    index={index + 1}
                    onClick={() =>
                      router.push(
                        `/blog/${post.slug}`
                      )
                    }
                  />
                )
              )}

            </div>

          ) : blogs.length === 0 ? (

            <div className="border border-white/10 p-12 md:p-20 text-center">

              <p className="text-orange-500 text-[9px] tracking-[0.4em] uppercase mb-5">
                The Journal
              </p>

              <h3 className="text-3xl md:text-5xl font-bold">
                No Stories Published Yet
              </h3>

              <p className="text-zinc-500 mt-5">
                New stories will appear here soon.
              </p>

            </div>

          ) : null}

        </div>
      </section>


      {/* =====================================
          FINAL MAGAZINE SECTION
      ====================================== */}

      <section className="bg-[#e9e4dc] text-[#171411] px-6 md:px-10 lg:px-16 py-24 md:py-36">

        <div className="max-w-[1500px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">

          <div>

            <p className="text-[9px] tracking-[0.4em] uppercase opacity-50 mb-6">
              Kutti Story Photography
            </p>

            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.06em] leading-[0.9]">
              Your story
              deserves to be
              remembered.
            </h2>

          </div>

          <div className="lg:max-w-md lg:justify-self-end">

            <p className="text-lg leading-relaxed opacity-70">
              Looking for a wedding
              photographer who captures more
              than just moments? Let’s create
              your story together.
            </p>

            <button
              onClick={() =>
                router.push("/contact-us")
              }
              className="group mt-10 inline-flex items-center gap-5 text-xs uppercase tracking-[0.3em] font-bold"
            >
              Book Your Story

              <span className="w-10 h-px bg-black group-hover:w-16 transition-all" />
            </button>

          </div>

        </div>
      </section>

    </section>
  );
};

export default BlogSection;