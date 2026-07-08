"use client";

import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";
import MediaField from "@/components/ui/MediaField";
import { MediaType } from "@/lib/media";

interface HeroData {
  backgroundImage: string;
  backgroundMediaType: MediaType;

  backgroundOpacity: number;
  backgroundBlur: number;
  backgroundBrightness: number;
  overlayOpacity: number;

  heading: string;
  subheading: string;
  paragraph: string;

  badgeText: string;
  primaryButtonText: string;
  secondaryButtonText: string;

  statsYears: string;
  statsStories: string;
  statsPassion: string;

  heroCardImage: string;
  heroCardMediaType: MediaType;

  awardText: string;
}

interface Slide {
  image1: string;
  image1MediaType: MediaType;

  image2: string;
  image2MediaType: MediaType;

  year: string;
}

interface StoryImage {
  src: string;
  mediaType: MediaType;
  alt: string;
}

interface HomeImageSlot {
  key: string;
  label: string;
  url: string;
  mediaType?: MediaType;
}

export default function HomepageSection() {
  const [activeTab, setActiveTab] = useState<
     "hero" | "slides" | "stories" | "images" | "about" | "logo"
  >("hero");

  const [hero, setHero] = useState<HeroData>({
    backgroundImage: "",

    backgroundOpacity: 100,
    backgroundBlur: 0,
    backgroundBrightness: 100,
    overlayOpacity: 20,

    backgroundMediaType: "image",

    heading: "",
    subheading: "",
    paragraph: "",

    badgeText: "",
    primaryButtonText: "",
    secondaryButtonText: "",

    statsYears: "",
    statsStories: "",
    statsPassion: "",

    heroCardImage: "",
    heroCardMediaType: "image",

    awardText: "",
});

  const [slides, setSlides] = useState<Slide[]>([]);
  const [storyImages, setStoryImages] = useState<StoryImage[]>([]);
  const [homeImages, setHomeImages] = useState<HomeImageSlot[]>([]);
  const [siteSettings, setSiteSettings] = useState({ logo: "", });
  const [aboutContent, setAboutContent] = useState({
  title: "About Kutti Story",
  heading: "We Make Only Authentic Visual Experiences",
  description:
    "Every frame we create is driven by emotion, story, and authenticity.",
  experienceBadge: "10+ Years Experience"
});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.hero) {
            setHero({
              backgroundImage: "",
              backgroundMediaType: "image",

              backgroundOpacity: 100,
              backgroundBlur: 0,
              backgroundBrightness: 100,
              overlayOpacity: 20,

              heading: "",
              subheading: "",
              paragraph: "",

              badgeText: "",
              primaryButtonText: "",
              secondaryButtonText: "",

              statsYears: "",
              statsStories: "",
              statsPassion: "",

              heroCardImage: "",
              heroCardMediaType: "image",

              awardText: "",

              ...data.settings.hero,
            });
          }

          if (data.settings.showcaseSlides) {
            setSlides(
              data.settings.showcaseSlides.map((slide: any) => ({
                ...slide,
                image1MediaType: slide.image1MediaType || "image",
                image2MediaType: slide.image2MediaType || "image",
              }))
            );
          }

          if (data.settings.storyImages) {
            setStoryImages(
              data.settings.storyImages.map((img: any) => ({
                ...img,
                mediaType: img.mediaType || "image",
              }))
            );
          }
          if (data.settings.siteSettings) {
            setSiteSettings(data.settings.siteSettings);
          }

          if (data.settings.homeImages) {
            setHomeImages(
              data.settings.homeImages.map((img: any) => ({
                ...img,
                mediaType: img.mediaType || "image",
              }))
            );
          }
        }

        if (data.settings.aboutContent) {
  setAboutContent(data.settings.aboutContent);
}

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async (section: string, data: unknown) => {
    setSaving(true);

    try {
      await fetch("/api/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });

      setSaved(true);

      setTimeout(() => setSaved(false), 2500);
    } catch {}

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const TEXT_FIELDS: {
    key: keyof HeroData;
    label: string;
    multiline?: boolean;
  }[] = [
    { key: "heading", label: "Heading" },
    { key: "subheading", label: "Subheading" },
    { key: "paragraph", label: "Paragraph", multiline: true },
    { key: "badgeText", label: "Badge Text" },
    { key: "primaryButtonText", label: "Primary Button Text" },
    { key: "secondaryButtonText", label: "Secondary Button Text" },
    { key: "statsYears", label: "Stats: Years (e.g. 7+)" },
    { key: "statsStories", label: "Stats: Stories (e.g. 213+)" },
    { key: "statsPassion", label: "Stats: Passion (e.g. 100%)" },
    { key: "awardText", label: "Award Badge Text" },
  ];

  const tabs = [
    { id: "hero", label: "Hero Section" },
    { id: "slides", label: "Showcase Slides" },
    { id: "stories", label: "Stories Strip" },
    { id: "images", label: "Page Images" },
    { id: "about", label: "About Section" },
    { id: "logo", label: "Website Logo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          Homepage Settings
        </h2>

        {saved && (
          <span className="text-green-400 text-sm flex items-center gap-1.5">
            ✓ Saved successfully
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t.id
                ? "bg-amber-500 text-black"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── HERO ── */}
      {activeTab === "hero" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
          <h3 className="text-white font-semibold text-lg">
            Hero Section
          </h3>

          <MediaField
            label="Background Image / Video"
            url={hero.backgroundImage}
            mediaType={hero.backgroundMediaType || "image"}
            onChange={(url, mediaType) =>
              setHero({
                ...hero,
                backgroundImage: url,
                backgroundMediaType: mediaType,
              })
            }
            allowedTypes={["image", "video"]}
            context="homepage"
            previewHeight="h-36"
          />

          {/* Background Effects */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5 space-y-5">
              <h4 className="text-white font-semibold">
                Background Effects
              </h4>

              {/* Opacity */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-zinc-300">
                    Background Opacity
                  </label>
                  <span className="text-amber-400 text-sm">
                    {hero.backgroundOpacity}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hero.backgroundOpacity}
                  onChange={(e) =>
                    setHero({
                      ...hero,
                      backgroundOpacity: Number(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Blur */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-zinc-300">
                    Background Blur
                  </label>
                  <span className="text-amber-400 text-sm">
                    {hero.backgroundBlur}px
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  value={hero.backgroundBlur}
                  onChange={(e) =>
                    setHero({
                      ...hero,
                      backgroundBlur: Number(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-zinc-300">
                    Background Brightness
                  </label>
                  <span className="text-amber-400 text-sm">
                    {hero.backgroundBrightness}%
                  </span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="150"
                  value={hero.backgroundBrightness}
                  onChange={(e) =>
                    setHero({
                      ...hero,
                      backgroundBrightness: Number(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Overlay */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-zinc-300">
                    Overlay Darkness
                  </label>
                  <span className="text-amber-400 text-sm">
                    {hero.overlayOpacity}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hero.overlayOpacity}
                  onChange={(e) =>
                    setHero({
                      ...hero,
                      overlayOpacity: Number(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

          <MediaField
            label="Hero Card Image"
            url={hero.heroCardImage}
            mediaType={hero.heroCardMediaType || "image"}
            onChange={(url, mediaType) =>
              setHero({
                ...hero,
                heroCardImage: url,
                heroCardMediaType: mediaType,
              })
            }
            allowedTypes={["image", "video"]}
            context="homepage"
          />

          {/* Text fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEXT_FIELDS.map(({ key, label, multiline }) => (
              <div
                key={key}
                className={multiline ? "md:col-span-2" : ""}
              >
                <label className="block text-zinc-400 text-sm mb-1.5">
                  {label}
                </label>

                {multiline ? (
                  <textarea
                    value={(hero as any)[key]}
                    onChange={(e) =>
                      setHero({
                        ...hero,
                        [key]: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none resize-none"
                  />
                ) : (
                  <input
                    value={(hero as any)[key]}
                    onChange={(e) =>
                      setHero({
                        ...hero,
                        [key]: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => save("hero", hero)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}

            Save Hero
          </button>
        </div>
      )}

      {/* ── SHOWCASE SLIDES ── */}
      {activeTab === "slides" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">
              Showcase Slides
            </h3>

            <button
              onClick={() =>
                setSlides([
                  ...slides,
                  {
                    image1: "",
                    image1MediaType: "image",

                    image2: "",
                    image2MediaType: "image",

                    year: "2K25",
                  },
                ])
              }
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Slide
            </button>
          </div>

          {slides.length === 0 && (
            <p className="text-zinc-500 text-sm">
              No slides yet. Add your first slide.
            </p>
          )}

          {slides.map((slide, i) => (
            <div
              key={i}
              className="border border-zinc-700 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm font-semibold">
                  Slide {i + 1}
                </span>

                <button
                  onClick={() =>
                    setSlides(
                      slides.filter((_, idx) => idx !== i)
                    )
                  }
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MediaField
                  label="Left Image"
                  url={slide.image1}
                  mediaType={slide.image1MediaType || "image"}
                  onChange={(url, mediaType) => {
                    const s = [...slides];

                    s[i].image1 = url;
                    s[i].image1MediaType = mediaType;

                    setSlides(s);
                  }}
                  allowedTypes={["image", "video"]}
                  context="homepage"
                />

                <MediaField
                  label="Right Image"
                  url={slide.image2}
                  mediaType={slide.image2MediaType}
                  onChange={(url, mediaType) => {
                    const s = [...slides];

                    s[i].image2 = url;
                    s[i].image2MediaType = mediaType;

                    setSlides(s);
                  }}
                  allowedTypes={["image", "video"]}
                  context="homepage"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">
                  Year Label
                </label>

                <input
                  value={slide.year}
                  onChange={(e) => {
                    const s = [...slides];
                    s[i].year = e.target.value;
                    setSlides(s);
                  }}
                  className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          ))}

          <button
            onClick={() => save("showcaseSlides", slides)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}

            Save Slides
          </button>
        </div>
      )}

      {/* ── STORIES STRIP ── */}
      {activeTab === "stories" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">
              Stories Strip Images
            </h3>

            <button
              onClick={() =>
                setStoryImages([
                  ...storyImages,
                  {
                    src: "",
                    mediaType: "image",
                    alt: `Story ${storyImages.length + 1}`,
                  },
                ])
              }
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Image
            </button>
          </div>

          {storyImages.length === 0 && (
            <p className="text-zinc-500 text-sm">
              No story images yet.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {storyImages.map((img, i) => (
              <div
                key={i}
                className="border border-zinc-700 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-500 text-xs font-medium">
                    Image {i + 1}
                  </span>

                  <button
                    onClick={() =>
                      setStoryImages(
                        storyImages.filter((_, idx) => idx !== i)
                      )
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <MediaField
                  label=""
                  url={img.src}
                  mediaType={img.mediaType}
                  onChange={(url, mediaType) => {
                    const s = [...storyImages];

                    s[i].src = url;
                    s[i].mediaType = mediaType;

                    setStoryImages(s);
                  }}
                  allowedTypes={["image"]}
                  context="homepage"
                  previewHeight="h-20"
                />

                <input
                  value={img.alt}
                  placeholder="Alt text"
                  onChange={(e) => {
                    const s = [...storyImages];
                    s[i].alt = e.target.value;
                    setStoryImages(s);
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => save("storyImages", storyImages)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}

            Save Story Images
          </button>
        </div>
      )}

      {/* ── PAGE IMAGES ── */}
      {activeTab === "images" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold text-lg">
            Page Image Slots
          </h3>

          <p className="text-zinc-500 text-sm">
            Manage specific image slots used across homepage sections.
          </p>

          {homeImages.map((slot, i) => (
            <div
              key={slot.key}
              className="border border-zinc-700 rounded-xl p-4"
            >
              <MediaField
                label={slot.label}
                url={slot.url}
                mediaType={slot.mediaType || "image"}
                onChange={(url, mediaType) => {
                  const s = [...homeImages];

                  s[i].url = url;
                  s[i].mediaType = mediaType;

                  setHomeImages(s);
                }}
                allowedTypes={["image", "video"]}
                context="homepage"
              />
            </div>
          ))}

          <button
            onClick={() => save("homeImages", homeImages)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}

            Save Page Images
                    </button>
        </div>
      )}

      {activeTab === "about" && (
        
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
          <h3 className="text-white font-semibold text-lg">
            About Section
          </h3>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Small Title
            </label>
            <input
              value={aboutContent.title}
              onChange={(e) =>
                setAboutContent({
                  ...aboutContent,
                  title: e.target.value,
                })
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Heading
            </label>
            <input
              value={aboutContent.heading}
              onChange={(e) =>
                setAboutContent({
                  ...aboutContent,
                  heading: e.target.value,
                })
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={aboutContent.description}
              onChange={(e) =>
                setAboutContent({
                  ...aboutContent,
                  description: e.target.value,
                })
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white"
            />
          </div>

          <div>
          <label className="block text-zinc-400 text-sm mb-2">
           Experience Badge Text
          </label>

          <input
           value={aboutContent.experienceBadge || ""}
           onChange={(e) =>
            setAboutContent({
             ...aboutContent,
            experienceBadge: e.target.value,
           })
          }
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white"
        />
         </div>

          <button
            onClick={() => save("aboutContent", aboutContent)}
            className="px-6 py-3 bg-amber-500 text-black rounded-xl font-semibold"
          >
            Save About Section
          </button>
        </div>
      )}
      {activeTab === "logo" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
          <h3 className="text-white font-semibold text-lg">
            Website Logo
          </h3>

          <MediaField
            label="Website Logo"
            url={siteSettings.logo}
            mediaType="image"
            onChange={(url) =>
              setSiteSettings({
                ...siteSettings,
                logo: url,
              })
            }
            allowedTypes={["image"]}
            context="homepage"
          />

          <button
            onClick={() => save("siteSettings", siteSettings)}
            className="px-6 py-3 bg-amber-500 text-black rounded-xl font-semibold"
          >
            Save Logo
          </button>
        </div>
      )}
    </div>
  );
}