"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_SERVICES = [
  {
    id: "wedding",
    title: "Wedding Stories",
    desc: "Capturing the raw emotions of your special day with a cinematic touch.",
    btnText: "Book Wedding",
    image:
      "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/03.webp",
  },
  {
    id: "outdoor",
    title: "Outdoor Shoots",
    desc: "Epic landscapes meet intimate portraits in the heart of nature.",
    btnText: "Explore Outdoor",
    image:
      "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/01.webp",
  },
  {
    id: "commercial",
    title: "Commercial Ads",
    desc: "High-end visual storytelling designed to elevate your brand presence.",
    btnText: "Start Campaign",
    image:
      "/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/09.webp",
  },
];

const Portfolio = () => {
  const containerRef = useRef(null);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  const [services, setServices] = useState(DEFAULT_SERVICES);

  const [headerText] = useState({
    heading: "Let's create magic together.",
    subheading:
      "Beyond just taking photos, we capture moments that live forever.",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchHomeImages = async () => {
      try {
        const response = await fetch("/api/homepage");
        const data = await response.json();

        const slots = data?.settings?.homeImages || [];
       
        const updated = DEFAULT_SERVICES.map((service) => {
         
          const slot = slots.find(
            (item) => item.key === `magic_${service.id}`
          );
          return slot
            ? {
                ...service,
                image: slot.url,
              }
            : service;
        });

        setServices(updated);
      } catch (error) {
        console.error(error);
      }
    };

    // fetchHomeImages();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();

        if (data?.services?.length) {
          const mapped = data.services.slice(0, 3).map((service) => ({
            id: service._id || service.id,
            title: service.title,
            desc:
              service.shortDescription ||
              service.description?.slice(0, 80) ||
              "",
            btnText: `Book ${service.title}`,
            image:
              service.coverImage || DEFAULT_SERVICES[0].image,
          }));
console.log('mapped----', mapped);

          setServices(mapped);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cta-card",
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".cta-grid",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [mounted, services]);

  const handleMagnetic = (e, button) => {
    const rect = button.getBoundingClientRect();

    gsap.to(button, {
      x: (e.clientX - rect.left - rect.width / 2) * 0.3,
      y: (e.clientY - rect.top - rect.height / 2) * 0.3,
      duration: 0.3,
    });
  };

  const resetMagnetic = (button) => {
    gsap.to(button, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.3)",
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      className="bg-black py-10 md:py-20 px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 text-white min-h-screen"
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4">
            {headerText.heading.split("magic").map((part, index, array) => (
              <span key={index}>
                {part}
                {index < array.length - 1 && (
                  <span className="text-orange-500">magic</span>
                )}
              </span>
            ))}
          </h2>

          <p className="text-zinc-400 text-lg max-w-3xl">
            {headerText.subheading}
          </p>
        </div>

        <div className="cta-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
          {services.map((service) => (
            <div
              key={service.id}
              className="cta-card group relative h-[500px] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900"
            >
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              <div className="absolute inset-0 p-8 flex flex-col justify-end items-start">
                <h3 className="text-3xl font-bold mb-2 transition-transform duration-500 group-hover:-translate-y-1">
                  {service.title}
                </h3>

                <p className="text-zinc-400 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  {service.desc}
                </p>

                <button
                  type="button"
                  onMouseMove={(e) =>
                    handleMagnetic(e, e.currentTarget)
                  }
                  onMouseLeave={(e) =>
                    resetMagnetic(e.currentTarget)
                  }
                  onClick={() => router.push("/contact-us")}
                  className="px-8 py-3 bg-white text-black rounded-full font-bold uppercase text-xs hover:bg-orange-500 hover:text-white transition-colors duration-300"
                >
                  {service.btnText} →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-10 md:p-16 rounded-[2.5rem] bg-zinc-950 border border-zinc-900 text-center">
          <h4 className="text-4xl font-bold mb-4">
            Need something custom?
          </h4>

          <button
            type="button"
            className="px-10 py-4 border border-zinc-700 rounded-full font-bold hover:bg-white hover:text-black transition-all"
            onClick={() => router.push("/contact")}
          >
            GET IN TOUCH
          </button>
        </div>
      </div>
    </section>
  );
};

