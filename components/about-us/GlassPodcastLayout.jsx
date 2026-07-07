'use client'
import Link from "next/link";
import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { DriveMedia } from '@/components/ui/DriveMedia'

const DEFAULT_IMAGES = [
  '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/01.webp',
  '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/02.webp',
  '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/03.webp',
  '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/04.webp',
]

export default function PhotographyAboutSection() {
  const containerRef = useRef(null)
  const heroTextContainerRef = useRef(null)

  const [settings, setSettings] = useState({
    heading:        'Capturing the',
    highlightWord:  'Silent Stories',
    subheading:     'We specialize in outdoor night shoots and cinematic storytelling, bringing out the soul of every moment.',
    paragraph:      '',
    images:         DEFAULT_IMAGES,
    profileImage:   DEFAULT_IMAGES[0],
    profileName:    'Leslie Alexander',
    profileRole:    'Lead Photographer',
    storyHeading: 'Behind the Lens',
    storyParagraph: 'Our night sessions showcase natural light and ambient night aesthetics.',
    storyImage: DEFAULT_IMAGES[1],
    storyRightImage: DEFAULT_IMAGES[2],
    storyVideo: '',
  })

  useEffect(() => {
    fetch('/api/about')
      .then((r) => r.json())
      .then((data) => {
        const h = data.settings?.hero
        const s = data.settings?.story
        if (!h && !s) return

        const imgs = Array.isArray(h?.images) && h.images.filter(Boolean).length
          ? h.images.filter(Boolean)
          : DEFAULT_IMAGES

        setSettings({
          heading:        h?.heading       || 'Capturing the',
          highlightWord:  h?.highlightWord || 'Silent Stories',
          subheading:     h?.subheading    || settings.subheading,
          paragraph:      h?.paragraph     || '',
          images:         [...imgs, ...DEFAULT_IMAGES].slice(0, 4),
          profileImage:   h?.profileImage  || imgs[0] || DEFAULT_IMAGES[0],
          profileName:    h?.profileName   || settings.profileName,
          profileRole:    h?.profileRole   || settings.profileRole,
          storyHeading:   s?.heading       || settings.storyHeading,
          storyParagraph: s?.paragraph     || settings.storyParagraph,
          storyImage:     s?.image         || imgs[1] || DEFAULT_IMAGES[1],

          storyRightImage:
            s?.rightImage ||
            imgs[2] ||
            DEFAULT_IMAGES[2],

          storyVideo: s?.videoUrl || '',
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.animate-card', { y: 50, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'power4.out' })

      const silentStories = document.querySelector('.silent-stories');

      if (!silentStories) return;

      const handleEnter = () => {
        gsap.to(silentStories, {
          color: '#ef4444',
          textShadow: '0px 0px 15px rgba(239,68,68,0.4)',
          duration: 0.5,
        });
      };

      const handleLeave = () => {
        gsap.to(silentStories, {
          color: '#444444',
          textShadow: '0px 0px 0px rgba(0,0,0,0)',
          duration: 0.5,
        });
      };

      silentStories.addEventListener('mouseenter', handleEnter);
      silentStories.addEventListener('mouseleave', handleLeave);

      return () => {
        silentStories.removeEventListener('mouseenter', handleEnter);
        silentStories.removeEventListener('mouseleave', handleLeave);
      };
    }, containerRef)
    return () => ctx.revert()
  }, [settings])

  return (
    <section ref={containerRef} className="min-h-screen bg-black p-4 md:p-10 flex items-center justify-center text-white font-sans overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-[1400px] w-full auto-rows-min">

        {/* ROW 1: MAIN HERO */}
        <div className="animate-card md:col-span-3 bg-[#0d0d0d] border border-white/5 rounded-[40px] p-10 flex flex-col justify-between min-h-[420px] relative overflow-hidden group">
          <div className="relative z-10 cursor-pointer" ref={heroTextContainerRef}>
            <h1 className="hover-heading text-5xl md:text-8xl font-bold leading-[0.95] mb-8 tracking-tighter">
              {settings.heading.includes(settings.highlightWord)
                ? <>
                    {settings.heading.split(settings.highlightWord)[0]}
                    <span className="silent-stories text-[#444444]">{settings.highlightWord}</span>
                    {settings.heading.split(settings.highlightWord)[1]}
                  </>
                : <>{settings.heading} <br /><span className="silent-stories text-[#444444]">{settings.highlightWord}</span></>
              } <br />
              in Every Frame...
            </h1>
            <p className="hover-para text-gray-500 max-w-sm text-lg leading-relaxed">{settings.subheading}</p>
            {settings.paragraph && (
              <p className="text-gray-600 max-w-md text-base leading-relaxed mt-3">{settings.paragraph}</p>
            )}
          </div>
          <div className="flex justify-end relative z-10">
            <Link href="/works">
            <button className="px-10 py-4 rounded-full border border-yellow-500/50 text-yellow-500 font-medium hover:bg-yellow-500 hover:text-black transition-all duration-500">
              Explore Gallery
            </button>
            </Link>
          </div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-900/5 blur-[120px] rounded-full group-hover:bg-red-600/10 transition-colors duration-700" />
        </div>

        {/* ROW 1: PROFILE */}
        <div className="animate-card md:col-span-1 bg-[#0d0d0d] border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 rounded-full border border-white/10 overflow-hidden mb-6 relative">
            <DriveMedia url={settings.profileImage} mediaType="image" className="w-full h-full object-cover" alt={settings.profileName} />
          </div>
          <h3 className="text-xl font-bold mb-1">{settings.profileName}</h3>
          <p className="text-gray-500 text-[10px] tracking-[0.3em] uppercase">{settings.profileRole}</p>
        </div>

        {/* ROW 2: MINI GALLERY */}
        <div className="animate-card md:col-span-1 bg-[#0d0d0d] border border-white/5 rounded-[40px] p-4">
          <div className="grid grid-cols-2 gap-2 h-full">
            {settings.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-[20px] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                <DriveMedia url={img} mediaType="image" className="w-full h-full object-cover" alt={`work ${idx}`} />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2: CASE STUDY */}
        <div className="animate-card md:col-span-2 bg-[#0d0d0d] border border-white/5 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <span className="absolute top-6 right-8 text-[9px] text-gray-600 tracking-[0.4em] font-mono">ESTD 2026</span>
          <div className="relative w-44 h-44 flex-shrink-0 group">
            <div className="absolute inset-0 rounded-full bg-yellow-500/10 scale-110 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-full h-full rounded-full overflow-hidden border-[4px] border-white/5 shadow-2xl">
              <DriveMedia
                url={settings.storyVideo || settings.storyImage}
                mediaType={settings.storyVideo ? "video" : "image"}
                className="w-full h-full object-cover"
                alt="Feature"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center pl-1">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-black border-b-[6px] border-b-transparent" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-bold mb-3 tracking-tight">{settings.storyHeading}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{settings.storyParagraph}</p>
            <a
              href="/about-us"
              className="group inline-flex items-center text-[11px] font-bold uppercase tracking-[0.25em] border-b border-yellow-500 pb-1 hover:text-yellow-500 transition-all duration-300"
            >
             DISCOVER KUTTI STORY

            <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">
              →
            </span>
           </a>
          </div>
        </div>

        {/* ROW 2: EXPERTISE */}
        <div className="animate-card md:col-span-1 bg-[#0d0d0d] border border-white/5 rounded-[40px] p-8 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-gray-600 mb-6 font-bold">Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {['Portrait', 'Night', 'Cinematic', 'Outdoor'].map((tag) => (
                <span key={tag} className="px-4 py-2 rounded-full border border-white/5 bg-white/[0.02] text-[9px] uppercase font-bold tracking-wider hover:border-yellow-500/50 transition-all cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <div className="relative h-24 w-full rounded-[20px] overflow-hidden">
              <DriveMedia
                  url={settings.storyRightImage}
                  mediaType="image"
                  className="w-full h-full object-cover opacity-40 hover:opacity-100 transition-opacity duration-700"
                  alt="Behind The Lens Right Image"
              />
            </div>
            <p className="text-[9px] text-center mt-4 text-gray-700 font-mono tracking-widest">INFO@SUPPORT.COM</p>
          </div>
        </div>

      </div>
    </section>
  )
}