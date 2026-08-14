"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  FaInstagram,
  FaYoutube,
  FaVimeoV,
  FaThreads,
  FaFacebook,
  FaWhatsapp,
} from "react-icons/fa6";
import { HiOutlineCamera, HiOutlineArrowRight } from "react-icons/hi2";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function PhotographyFooter() {
  const footerRef = useRef(null);

  const [socials, setSocials] = useState({
    instagramUrl: "",
    facebookUrl: "",
    youtubeUrl: "",
    threadsUrl: "",
    vimeoUrl: "",
    whatsapp: "",
  });

  useEffect(() => {
    fetch("/api/contact")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setSocials({
            instagramUrl: data.settings.instagramUrl || "",
            facebookUrl: data.settings.facebookUrl || "",
            youtubeUrl: data.settings.youtubeUrl || "",
            threadsUrl: data.settings.threadsUrl || "",
            vimeoUrl: data.settings.vimeoUrl || "",
            whatsapp: data.settings.whatsapp || "",
          });
        }
      })
      .catch(() => { });

    const ctx = gsap.context(() => {
      gsap.from(".shutter-text", {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 80%",
        },
      });

      gsap.to(".live-dot", {
        opacity: 0.4,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="bg-black text-white px-4 sm:px-6 md:px-16 py-16 md:py-24 w-full overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">

        {/* Cinematic Header Section */}
        <div className="mb-12 md:mb-24 border-b border-zinc-900 pb-10 md:pb-16">
          <div className="shutter-text flex items-center gap-3 text-zinc-500 mb-6 tracking-[0.3em] text-xs font-bold uppercase">
            <span className="relative flex h-2 w-2">
              <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            Capturing the Frame
          </div>
          <h2 className="shutter-text text-3xl sm:text-5xl md:text-8xl font-light tracking-tighter leading-none mb-6 md:mb-8">
            Every frame tells a <br />
            <span className="italic font-serif text-zinc-400">Kutti Story.</span>
          </h2>
           <Link href="/contact-us" className="inline-block px-8 py-4 bg-orange-500 text-black rounded-full font-bold hover:bg-orange-400 transition">
          <button className="shutter-text group flex items-center gap-4 text-xl hover:text-zinc-400 transition-colors duration-500">
            Book your session <HiOutlineArrowRight className="group-hover:translate-x-4 transition-transform duration-500" />
          </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">

          {/* Newsletter / Story Subscription */}
          <div className="md:col-span-5 shutter-text">
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 space-y-6 hover:border-zinc-700 transition-colors duration-700">
              <div>
                <h4 className="text-xl font-medium mb-2">The Monthly Digest</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Behind-the-scenes, camera settings, and the small stories behind our favorite shots.
                </p>
              </div>

              <form className="relative group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-black 
               
               border border-zinc-500 
               rounded-xl py-4 px-5 text-sm 
               text-white placeholder:text-zinc-600 
               focus:outline-none focus:border-white focus:ring-1 focus:ring-white
               hover:border-zinc-300
               transition-all duration-300"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 
                     bg-white text-black p-2 rounded-lg 
                     hover:bg-zinc-200 active:scale-90
                     transition-all duration-300">
                  <HiOutlineCamera className="w-5 h-5" />
                </button>
              </form>
              <p className="text-[10px] text-zinc-700 uppercase tracking-widest">No spam. Only visuals.</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="shutter-text space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-600">Galleries</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li>
                  <Link href="/works" className="text-zinc-400 hover:text-white transition-colors">
                    Wedding Portfolio
                  </Link>
                </li>

                <li>
                  <Link href="/works" className="text-zinc-400 hover:text-white transition-colors">
                    Engagement Photography
                  </Link>
                </li>

                <li>
                  <Link href="/works" className="text-zinc-400 hover:text-white transition-colors">
                    Couple Portraits
                  </Link>
                </li>

                <li>
                  <Link href="/blog" className="text-zinc-400 hover:text-white transition-colors">
                    Photography Stories
                  </Link>
                </li>
              </ul>
            </div>

            <div className="shutter-text space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-600">Studio</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li>
                    <Link href="/about-us" className="text-zinc-400 hover:text-white transition-colors">
                      About Us
                    </Link>
                  </li>

                  <li>
                    <Link href="/services" className="text-zinc-400 hover:text-white transition-colors">
                      Our Services
                    </Link>
                  </li>

                  <li>
                    <Link href="/contact-us" className="text-zinc-400 hover:text-white transition-colors">
                      Book a Shoot
                    </Link>
                  </li>
              </ul>
            </div>

            <div className="shutter-text space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-600">Social</h4>
              <div className="flex flex-col gap-4">
                {[
                  {
                    Icon: FaInstagram,
                    name: "Instagram",
                    url: socials.instagramUrl,
                  },

                  {
                    Icon: FaFacebook,
                    name: "Facebook",
                    url: socials.facebookUrl,
                  },

                  {
                    Icon: FaWhatsapp,
                    name: "WhatsApp",
                    url: socials.whatsapp
                      ? `https://wa.me/${socials.whatsapp.replace(/[^0-9]/g, "")}`
                      : "",
                  },

                  {
                    Icon: FaThreads,
                    name: "Threads",
                    url: socials.threadsUrl,
                  },

                  {
                    Icon: FaYoutube,
                    name: "YouTube",
                    url: socials.youtubeUrl,
                  },

                  {
                    Icon: FaVimeoV,
                    name: "Vimeo",
                    url: socials.vimeoUrl,
                  },
                ]
                  .filter((item) => item.url)
                  .map(({ Icon, name, url }) => (
                    <Link
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-zinc-500 hover:text-white transition-all group"
                    >
                      <Icon className="w-4 h-4 group-hover:scale-125 transition-transform duration-300" />

                      <span className="text-xs uppercase tracking-tighter">
                        {name}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Section */}
        {/* Bottom Footer */}
        <div className="mt-16 md:mt-32 pt-10 border-t border-zinc-900">

          <div className="flex flex-col md:flex-row justify-between gap-10">

            {/* Brand */}
            <div className="md:w-1/3">
              <h3 className="text-2xl font-semibold text-white">
                Kutti Story Photography
              </h3>

              <p className="text-zinc-400 mt-3 leading-7 max-w-sm">
                Capturing Life, One Story at a Time.
              </p>
            </div>

            {/* Contact */}
            <div className="md:w-1/3 md:text-center">
              <h4 className="text-white font-semibold mb-4">
                Contact Us
              </h4>

              <div className="space-y-3 text-zinc-400 text-sm">
                <p className="leading-6">
                  📍 Door No: 39, KUTTISTORY PHOTOGRAPHY, BY PASS, near PORKUDAM ENTRANCE,
                  opp. KFC, RS 62/5E, S S Colony, Madurai, Tamil Nadu 625016
                </p>
                <p>📞 +91 93420 13600</p>
                <p>✉️ kuttistoryphotography@gmail.com</p>
              </div>
            </div>

            {/* Links */}
            <div className="md:w-1/3 md:text-right">
              <h4 className="text-white font-semibold mb-4">
                Quick Links
              </h4>

              <div className="flex flex-col gap-3 text-sm">
                <Link href="/about-us" className="text-zinc-400 hover:text-white">
                  About Us
                </Link>

                <Link href="/works" className="text-zinc-400 hover:text-white">
                  Portfolio
                </Link>

                <Link href="/blog" className="text-zinc-400 hover:text-white">
                  Blog
                </Link>

                <Link href="/contact-us" className="text-zinc-400 hover:text-white">
                  Contact
                </Link>
              </div>
            </div>

          </div>

          <div className="border-t border-zinc-900 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center w-full text-sm text-zinc-500">

            <div className="flex flex-col">
              <p>
                © {new Date().getFullYear()} Kutti Story Photography. All Rights Reserved.
              </p>

              <p className="text-xs text-zinc-600 mt-2">
                Website Designed & Developed by Kutti Story Media.
              </p>
            </div>

            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>

              <Link href="/terms-and-conditions" className="hover:text-white">
                Terms & Conditions
              </Link>
            </div>

          </div>

        </div>
      </div>
    </footer>
  );
}
