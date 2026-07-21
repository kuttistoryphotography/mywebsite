'use client'

import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DriveMedia } from '@/components/ui/DriveMedia'

gsap.registerPlugin(ScrollTrigger)

interface TeamMember { name: string; role: string; image: string }


export default function PhotographyTeamPage() {
  const containerRef = useRef(null)
  const [team, setTeam] = useState<TeamMember[]>([])
  
  useEffect(() => {
    fetch('/api/about')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.settings?.team)) {
          setTeam(data.settings.team)
        } else {
          setTeam([])
        }
      })
      .catch((err) => {
        console.error("Failed to load team:", err)
        setTeam([])
      })
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.reveal-up', { y: 80, opacity: 0, duration: 1.5, ease: 'expo.out', stagger: 0.2 })

      const cards = gsap.utils.toArray<HTMLElement>('.team-card')
      cards.forEach((card, i) => {
        gsap.from(card, {
          y: i % 2 === 0 ? 100 : 200, opacity: 0, duration: 1.5, ease: 'power4.out',
          scrollTrigger: { trigger: card, start: 'top 90%' },
        })
      })
    }, containerRef)
    return () => ctx.revert()
  }, [team])

  return (
    <section ref={containerRef} className="relative w-full bg-[#050505] text-white py-24 overflow-hidden">
      <div className="absolute top-10 left-0 w-full overflow-hidden opacity-[0.02] pointer-events-none select-none z-0">
        <h2 className="text-[20vw] font-black uppercase tracking-tighter leading-none whitespace-nowrap">
          Visionaries / Creators
        </h2>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-12 group/mainheader">
          <div className="max-w-2xl group/title cursor-default">
            <span className="text-yellow-500 font-mono text-sm tracking-[0.4em] uppercase block mb-4 reveal-up transition-all duration-500 group-hover/title:translate-x-3 group-hover/title:text-white">
              01 / Our People
            </span>
            <h2 className="text-6xl md:text-8xl font-bold leading-[0.9] reveal-up">
              <span className="block transition-all duration-700 group-hover/mainheader:text-neutral-400">The Minds</span>
              <span className="text-neutral-800 italic transition-all duration-700 group-hover/title:text-yellow-500 group-hover/title:not-italic group-hover/title:pl-4 inline-block">
                Behind Lens.
              </span>
            </h2>
          </div>
          <div className="max-w-sm reveal-up group/para cursor-default relative">
            <div className="absolute -left-6 top-0 w-[2px] h-0 bg-yellow-500 transition-all duration-500 group-hover/para:h-full" />
            <p className="text-neutral-500 text-lg leading-relaxed transition-all duration-500 group-hover/para:text-white group-hover/para:translate-x-2">
              A collective of{' '}
              <span className="text-neutral-400 group-hover/para:text-yellow-500 transition-colors duration-500">visual storytellers</span>{' '}
              dedicated to preserving the raw emotions of the night. Every frame is a promise.
            </p>
            <div className="mt-4 flex items-center gap-2 opacity-0 -translate-x-4 transition-all duration-500 group-hover/para:opacity-100 group-hover/para:translate-x-0">
              <div className="h-[1px] w-8 bg-yellow-500" />
              <span className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">Our Philosophy</span>
            </div>
          </div>
        </div>

        {/* TEAM GRID */}
          {team.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-24 items-start">
          {team.map((member, index) => (
            <div
              key={index}
              className={`team-card group relative flex flex-col cursor-pointer ${index % 2 !== 0 ? 'md:mt-32' : ''}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-neutral-900 grayscale hover:grayscale-0 transition-all duration-700 border border-white/5 shadow-2xl">
                <DriveMedia
                  url={member.image}
                  mediaType="image"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt={member.name}
                />
                <div className="absolute top-6 right-6 mix-blend-difference opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold origin-top-right rotate-90 translate-x-full">
                    {member.role}
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm">
                  <a href="/works">
                    <button className="text-[10px] uppercase font-bold tracking-widest border border-white/20 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-colors w-full">
                      View Portfolio
                    </button>
                  </a>
                </div>
              </div>
              <div className="mt-8 px-2 transition-transform duration-500 group-hover:-translate-y-2">
                <h3 className="text-xl font-bold tracking-tight mb-1 group-hover:text-yellow-500 transition-all duration-300">
                  {member.name}
                </h3>
                <div className="relative inline-block overflow-hidden">
                  <p className="text-xs text-neutral-600 font-mono uppercase tracking-widest transition-colors duration-500 group-hover:text-neutral-300">
                    {member.role}
                  </p>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              </div>
            </div>
            ))}
        </div>
)}

        {/* FOOTER CTA */}
        <div className="mt-48 flex flex-col items-center text-center">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-800 to-transparent mb-20" />
          <h3 className="text-4xl font-bold mb-8 group cursor-default">
            Do you have a 
            <span className="text-yellow-500 transition-all duration-300 group-hover:px-4">vision?</span>
          </h3>
          <p className="text-neutral-500 mb-10 max-w-md hover:text-white transition-colors duration-500">
            We are always looking for fresh perspectives to join our night-shoot collective.
          </p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeV69v9kyS1KBNLPyQdsV-8F56xImAFJ0_IKKDt3NvDBBEPaQ/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center px-12 py-5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full overflow-hidden transition-all hover:pr-16 hover:bg-yellow-500"
          >
            <span className="relative z-10">Join the Crew</span>
            <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}