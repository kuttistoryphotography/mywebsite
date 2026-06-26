'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DriveMedia } from '@/components/ui/DriveMedia'
import { ChevronDown } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface TimelineEntry { id: string; year: string; title: string; text: string; image: string }

const DEFAULT_TIMELINE: TimelineEntry[] = [
  { id: 'vision',      year: '2025', title: 'The Modern Era',      text: 'Innovation meets emotion. Using AI-enhanced workflows to deliver timeless quality.',       image: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/01.webp' },
  { id: 'legacy',      year: '2024', title: 'Legacy Building',     text: 'Introducing premium cinematic films alongside our award-winning photography.',            image: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/20.webp' },
  { id: 'foundation',  year: '2023', title: 'Foundation & Growth', text: 'Building Kutti Story Photography with a strong focus on quality and client trust.',       image: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp' },
  { id: 'creative',    year: '2022', title: 'Creative Pursuits',   text: 'Exploring advanced lighting, composition, and storytelling techniques.',                  image: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/02.webp' },
  { id: 'inspiration', year: '2020', title: 'Early Inspirations',  text: 'Developing a deep passion for capturing real emotions and timeless moments.',            image: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/03.webp' },
  { id: 'mastery',     year: '2019', title: 'Technical Mastery',   text: 'Mastering camera systems, lighting science, and post-processing workflows.',             image: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/04.webp' },
  { id: 'spark',       year: '2018', title: 'The First Spark',     text: 'The moment a hobby transformed into a lifelong pursuit of visual excellence.',           image: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/27.webp' },
]

export default function AboutTimeline() {
  const [timeline, setTimeline]   = useState<TimelineEntry[]>(DEFAULT_TIMELINE)
  const [activeTab, setActiveTab] = useState(0)
  const [isMobile, setIsMobile]   = useState(false)
  const mainRef   = useRef<HTMLElement>(null)
  const navRef    = useRef<HTMLDivElement>(null)
  const yearLabelRef = useRef<HTMLDivElement>(null)

  /* ── responsive flag ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* ── fetch from API ── */
  useEffect(() => {
    fetch('/api/about')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.settings?.timeline) && data.settings.timeline.length) {
          setTimeline(
            data.settings.timeline.map((e: TimelineEntry, i: number) => ({
              id:    e.id    || DEFAULT_TIMELINE[i]?.id    || `entry-${i}`,
              year:  e.year  || DEFAULT_TIMELINE[i]?.year  || '',
              title: e.title || DEFAULT_TIMELINE[i]?.title || '',
              text:  e.text  || DEFAULT_TIMELINE[i]?.text  || '',
              image: e.image || DEFAULT_TIMELINE[i]?.image || '',
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  /* ── ScrollTrigger: detect active panel ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>('.timeline-panel')
      panels.forEach((panel, i) => {
        ScrollTrigger.create({
          trigger: panel,
          start:   'top 60%',
          end:     'bottom 40%',
          onToggle: (self) => {
            if (self.isActive) setActiveTab(i)
          },
        })
      })

      /* ── entrance animations for each panel ── */
      panels.forEach((panel) => {
        const inner = panel.querySelector('.panel-inner')
        if (!inner) return
        gsap.fromTo(
          inner,
          { y: 60, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: {
              trigger: panel,
              start:   'top 72%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      })
    }, mainRef)
    return () => ctx.revert()
  }, [timeline])

  /* ── Nav avatar label sync ── */
  useEffect(() => {
    if (yearLabelRef.current) {
      gsap.to(yearLabelRef.current, { opacity: 0, y: -4, duration: 0.15, onComplete: () => {
        if (yearLabelRef.current) {
          yearLabelRef.current.textContent = timeline[activeTab]?.year ?? ''
          gsap.to(yearLabelRef.current, { opacity: 1, y: 0, duration: 0.2 })
        }
      }})
    }
  }, [activeTab, timeline])

  const scrollToSection = (idx: number) => {
    const target = document.getElementById(timeline[idx].id)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const scrollToFirst = () => {
    const target = document.getElementById(timeline[0].id)
    target?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section ref={mainRef} className="relative bg-black text-white w-full overflow-hidden">

      {/* ════════════════════════════════════
          BACKGROUND — full-bleed sticky layer
      ════════════════════════════════════ */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {timeline.map((item, idx) => (
            <div
              key={`bg-${item.id}`}
              className={`absolute inset-0 transition-all duration-[1400ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
                activeTab === idx
                  ? 'opacity-35 scale-100 blur-none'
                  : 'opacity-0 scale-105 blur-sm'
              }`}
            >
              <DriveMedia
                url={item.image}
                mediaType="image"
                className="w-full h-full object-cover"
                alt="background"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/80" />
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════
          STICKY AVATAR NAV
          — desktop: floating pill of avatars
          — mobile:  slimmer pill, smaller avatars + year label
      ════════════════════════════════════ */}
      <div
        ref={navRef}
        className="sticky top-4 md:top-6 z-50 flex justify-center h-0"
        aria-label="Timeline navigation"
      >
        <div className="relative flex items-center gap-1.5 md:gap-2.5 bg-black/40 backdrop-blur-2xl px-2 md:px-3 py-2 md:py-2.5 rounded-full border border-white/10 shadow-2xl shadow-black/60 translate-y-4">

          {/* Year floating label — shows above active avatar */}
          <div
            ref={yearLabelRef}
            className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-[0.3em] text-white/80 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 whitespace-nowrap pointer-events-none"
          >
            {timeline[activeTab]?.year}
          </div>

          {timeline.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(idx)}
              aria-label={`Jump to ${item.year} — ${item.title}`}
              className="group relative flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full"
            >
              {/* Avatar circle */}
              <div className={`
                relative rounded-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${activeTab === idx
                  ? 'w-9 h-9 md:w-14 md:h-14 ring-2 ring-red-500 ring-offset-2 ring-offset-black scale-110 shadow-lg shadow-red-900/50'
                  : 'w-7 h-7 md:w-10 md:h-10 opacity-35 grayscale hover:opacity-60 hover:grayscale-0 hover:scale-105'}
              `}>
                <DriveMedia
                  url={item.image}
                  mediaType="image"
                  className="w-full h-full object-cover"
                  alt={item.year}
                />
                {/* Active glow pulse */}
                {activeTab === idx && (
                  <span className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
                )}
              </div>

              {/* Tooltip on hover — desktop only */}
              <div className="hidden md:block absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                <span className="text-[9px] font-bold tracking-widest text-white/70 bg-black/80 px-2 py-1 rounded-full border border-white/10">
                  {item.year}
                </span>
              </div>
            </button>
          ))}

          {/* Progress line behind avatars */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-px bg-white/10 -z-10 pointer-events-none" />
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 h-px bg-red-500/60 -z-10 pointer-events-none transition-all duration-700 ease-out"
            style={{ width: `${(activeTab / Math.max(timeline.length - 1, 1)) * (100 - 8)}%` }}
          />
        </div>
      </div>

      {/* ════════════════════════════════════
          CONTENT PANELS
      ════════════════════════════════════ */}
      <div className="relative z-10">

        {/* ── Hero intro ── */}
        <div className="h-screen flex flex-col justify-center items-center text-center px-6">
          <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-white/40 mb-5 md:mb-6">
            Est. 2018 · Visual storytellers
          </p>
          <h2 className="text-[13vw] sm:text-[11vw] md:text-[9vw] lg:text-[8vw] font-black uppercase tracking-tighter leading-none">
            Our&nbsp;<span className="text-red-600">Legacy</span>
          </h2>
          <p className="mt-5 text-white/40 tracking-widest uppercase text-[10px] md:text-xs">
            Scroll to explore the journey
          </p>

          {/* Scroll cue */}
          <button
            onClick={scrollToFirst}
            className="mt-10 md:mt-14 flex flex-col items-center gap-2 group"
            aria-label="Start scrolling"
          >
            <span className="text-[9px] tracking-[0.3em] uppercase text-white/30 group-hover:text-white/60 transition-colors">
              Begin
            </span>
            <ChevronDown className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors animate-bounce" />
          </button>
        </div>

        {/* ── Timeline panels ── */}
        {timeline.map((item, idx) => (
          <div
            key={item.id}
            id={item.id}
            className="timeline-panel min-h-screen w-full flex items-center justify-center py-24 px-5 md:px-10"
          >
            <div className="panel-inner w-full max-w-2xl">

              {/* Mobile: image preview card */}
              <div className="md:hidden w-full aspect-[16/9] rounded-2xl overflow-hidden mb-7 border border-white/10 shadow-2xl shadow-black/60">
                <DriveMedia
                  url={item.image}
                  mediaType="image"
                  className="w-full h-full object-cover"
                  alt={item.title}
                />
              </div>

              {/* Year badge */}
              <div className="flex items-center gap-3 mb-5 md:mb-6 justify-center md:justify-start">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-red-600/60 bg-red-600/10 text-red-400 text-xs font-black tracking-[0.25em]">
                  {item.year}
                </span>
                {/* Step counter */}
                <span className="text-[10px] text-white/25 tracking-widest font-medium">
                  {String(idx + 1).padStart(2, '0')} / {String(timeline.length).padStart(2, '0')}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-[9vw] sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight mb-6 md:mb-8 text-center md:text-left">
                {item.title}
              </h2>

              {/* Body text */}
              <p className="text-base md:text-lg lg:text-xl font-light leading-relaxed text-white/70 text-center md:text-left backdrop-blur-sm bg-black/20 rounded-2xl p-5 md:p-7 border border-white/5">
                {item.text}
              </p>

              {/* Nav arrows — desktop only */}
              <div className="hidden md:flex items-center gap-4 mt-8">
                {idx > 0 && (
                  <button
                    onClick={() => scrollToSection(idx - 1)}
                    className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-white/30 hover:text-white transition-colors group"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    {timeline[idx - 1].year}
                  </button>
                )}
                {idx < timeline.length - 1 && (
                  <button
                    onClick={() => scrollToSection(idx + 1)}
                    className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-white/30 hover:text-white transition-colors group ml-auto"
                  >
                    {timeline[idx + 1].year}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* ── Outro CTA ── */}
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-white/40 text-xs tracking-[0.4em] uppercase">Ready to be part of our story?</p>
          <h3 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight">
            Write Your <span className="text-red-600">Chapter</span>
          </h3>
          <a href="/booking">
            <button className="mt-2 px-10 md:px-14 py-4 md:py-5 bg-red-600 hover:bg-red-700 active:scale-95 rounded-full font-bold uppercase tracking-[0.2em] text-sm transition-all hover:scale-105 shadow-2xl shadow-red-900/50">
              Book Your Story
            </button>
          </a>
        </div>
      </div>
    </section>
  )
}
