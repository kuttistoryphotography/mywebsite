'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DriveMedia } from '@/components/ui/DriveMedia'

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
  const [timeline, setTimeline] = useState<TimelineEntry[]>(DEFAULT_TIMELINE)
  const [activeTab, setActiveTab] = useState(0)
  const mainRef = useRef<HTMLElement>(null)

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

  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>('.timeline-panel')
      panels.forEach((panel, i) => {
        ScrollTrigger.create({
          trigger: panel,
          start: 'top center',
          end: 'bottom center',
          onToggle: (self) => self.isActive && setActiveTab(i),
        })
      })
    }, mainRef)
    return () => ctx.revert()
  }, [timeline])

  const scrollToSection = (idx: number) => {
    const target = document.getElementById(timeline[idx].id)
    target?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section ref={mainRef} className="relative bg-black text-white w-full">
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {timeline.map((item, idx) => (
            <div
              key={`bg-${item.id}`}
              className={`absolute inset-0 transition-all duration-[1200ms] ease-out ${
                activeTab === idx ? 'opacity-40 scale-100 blur-0' : 'opacity-0 scale-110 blur-sm'
              }`}
            >
              <DriveMedia
                url={item.image}
                mediaType="image"
                className="w-full h-full object-cover"
                alt="background"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
            </div>
          ))}
        </div>
      </div>

      {/* STICKY AVATAR NAV */}
      <div className="sticky top-10 z-50 flex justify-center h-0">
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl p-2 rounded-full border border-white/10 translate-y-4">
          {timeline.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(idx)}
              className={`relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden transition-all duration-500 border-2 ${
                activeTab === idx ? 'border-red-600 scale-110 shadow-lg' : 'border-transparent opacity-30 grayscale'
              }`}
            >
              <DriveMedia
                url={item.image}
                mediaType="image"
                className="w-full h-full object-cover"
                alt={item.year}
              />
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT PANELS */}
      <div className="relative z-10">
        {/* Intro */}
        <div className="h-screen flex flex-col justify-center items-center text-center">
          <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter">
            Our <span className="text-red-600">Legacy</span>
          </h1>
          <p className="mt-4 text-neutral-400 tracking-widest uppercase text-xs md:text-sm">
            Scroll to explore the journey
          </p>
        </div>

        {timeline.map((item) => (
          <div key={item.id} id={item.id} className="timeline-panel h-screen w-full flex items-center justify-center">
            <div className="max-w-xl w-full px-6 text-center">
              <div className="inline-block px-4 py-1 rounded-full border border-red-600 text-red-600 text-xs font-bold mb-6">
                {item.year}
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">{item.title}</h2>
              <p className="text-neutral-400 text-lg md:text-xl font-light leading-relaxed backdrop-blur-sm bg-black/20 p-6 rounded-2xl">
                {item.text}
              </p>
            </div>
          </div>
        ))}

        {/* Outro */}
        <div className="h-screen flex items-center justify-center">
          <button className="px-12 py-5 bg-red-600 hover:bg-red-700 rounded-full font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 shadow-xl">
            Book Your Story
          </button>
        </div>
      </div>
    </section>
  )
}