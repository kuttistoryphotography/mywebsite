"use client";

import { useEffect, useRef, useState } from "react";

export default function LoadingScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [showBrand, setShowBrand] = useState(false);

  useEffect(() => {
    // Prevent scrolling while loading screen is visible
    document.body.style.overflow = "hidden";

    // Show brand near the end of the animation
    const brandTimer = setTimeout(() => {
      setShowBrand(true);
    }, 4000);

    return () => {
      clearTimeout(brandTimer);
      document.body.style.overflow = "";
    };
  }, []);

  const finishLoading = () => {
    // Start fade-out
    setFadeOut(true);

    // Remove loading screen completely
    setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 1000);
  };

  if (!visible) return null;

  return (
    <div
      className={`
        fixed
        inset-0
        z-[999999]
        w-screen
        h-screen
        bg-black
        overflow-hidden
        flex
        items-center
        justify-center
        transition-opacity
        duration-1000
        ease-out
        ${fadeOut ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* =========================================
          COUPLE LOADING VIDEO
      ========================================== */}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finishLoading}
        className="
          absolute
          inset-0
          w-full
          h-full
          object-contain
        "
      >
        <source
          src="/videos/couple-loading.mp4"
          type="video/mp4"
        />

        Your browser does not support the video tag.
      </video>

      {/* =========================================
          PREMIUM BRAND NAME
      ========================================== */}

      <div
        className={`
            absolute
            bottom-[10%]
            left-0
            right-0
            z-10
            flex
            flex-col
            items-center
            justify-center
            pointer-events-none
            text-center
            px-6
            transition-all
            duration-[1500ms]
            ease-out
            ${
            showBrand
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }
        `}
        >
        {/* Small Intro */}
        <div
            className="
            text-white/70
            font-sans
            font-light
            uppercase
            tracking-[0.5em]
            text-[clamp(0.55rem,0.8vw,0.85rem)]
            "
        >
            Welcome To Our
        </div>

        {/* Main Message */}
        <h1
            className="
            mt-3
            text-white
            font-serif
            font-light
            uppercase
            tracking-[0.08em]
            leading-none
            text-[clamp(1.8rem,4vw,4rem)]
            drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]
            "
        >
            Cinematic World
        </h1>

        {/* Divider */}
        <div
            className="
            mt-5
            h-px
            w-16
            bg-white/40
            "
        />
        </div>
    </div>
  );
}