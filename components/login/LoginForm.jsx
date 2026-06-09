"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import Script from "next/script";

export default function LoginForm() {
  const formRef = useRef(null);
  const imageWrapperRef = useRef(null);
  const imageRef = useRef(null);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google Sign-In response
  const handleGoogleResponse = useCallback(async (response) => {
    if (!response.credential) {
      setError("Google sign-in failed. Please try again.");
      return;
    }

    setGoogleLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Google sign-in failed");
        setGoogleLoading(false);
        return;
      }

      // Emit auth-changed so header and other components update immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:changed"));
      }

      // Redirect based on role
      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setGoogleLoading(false);
    }
  }, [router]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { 
          theme: "filled_black", 
          size: "large", 
          width: "100%",
          text: "signin_with",
          shape: "rectangular",
        }
      );
    }
  }, [handleGoogleResponse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Emit auth-changed so header and other components update immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:changed'));
      }

      // Redirect based on role
      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial Entrance Animation
      const tl = gsap.timeline();
      tl.fromTo(
        formRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 1, ease: "power4.out" }
      ).fromTo(
        imageWrapperRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "power4.out" },
        "-=0.8"
      );

      // Interactive Hover Effect
      const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = imageWrapperRef.current.getBoundingClientRect();
        
        // Calculate mouse position relative to center of image (range -1 to 1)
        const xPos = (clientX - left) / width - 0.5;
        const yPos = (clientY - top) / height - 0.5;

        gsap.to(imageWrapperRef.current, {
          rotationY: xPos * 10, // Tilt left/right
          rotationX: -yPos * 10, // Tilt up/down
          transformPerspective: 1000,
          duration: 0.6,
          ease: "power2.out",
        });

        gsap.to(imageRef.current, {
          scale: 1.1,
          x: -xPos * 20,
          y: -yPos * 20,
          duration: 0.6,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        gsap.to([imageWrapperRef.current, imageRef.current], {
          rotationY: 0,
          rotationX: 0,
          scale: 1,
          x: 0,
          y: 0,
          duration: 1,
          ease: "elastic.out(1, 0.5)",
        });
      };

      const wrapper = imageWrapperRef.current;
      wrapper.addEventListener("mousemove", handleMouseMove);
      wrapper.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        wrapper.removeEventListener("mousemove", handleMouseMove);
        wrapper.removeEventListener("mouseleave", handleMouseLeave);
      };
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* LEFT – LOGIN FORM */}
        <div ref={formRef} className="order-2 md:order-1">
          <div className="max-w-sm mx-auto md:ml-0">
            <h1 className="text-4xl font-semibold tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-zinc-500 mb-8">
              Enter your details to access your gallery.
            </p>

            {/* Google Sign-In Script */}
            <Script
              src="https://accounts.google.com/gsi/client"
              strategy="afterInteractive"
              onLoad={() => {
                if (window.google) {
                  window.google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                  });
                  window.google.accounts.id.renderButton(
                    document.getElementById("google-signin-button"),
                    { 
                      theme: "filled_black", 
                      size: "large", 
                      width: 320,
                      text: "signin_with",
                      shape: "rectangular",
                    }
                  );
                }
              }}
            />

            {/* Google Sign-In Button */}
            <div className="mb-6">
              <div 
                id="google-signin-button" 
                className="w-full flex justify-center"
              />
              {googleLoading && (
                <p className="text-center text-sm text-zinc-500 mt-2">
                  Signing in with Google...
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                or continue with email
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="name@domain.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Show Password Checkbox */}
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="show-password"
                  className="accent-white w-4 h-4 rounded"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <label htmlFor="show-password" className="text-sm text-zinc-400 cursor-pointer">
                  Show password
                </label>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="accent-white w-4 h-4"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link href="#" className="text-zinc-500 hover:text-white transition">
                  Forgot?
                </Link>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-lg font-bold hover:bg-zinc-200 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="text-center md:text-left text-sm text-zinc-500 mt-8">
              New here?{" "}
              <Link href="/signup" className="text-white hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT – INTERACTIVE IMAGE PANEL */}
        <div className="order-1 md:order-2 perspective-1000">
          <div
            ref={imageWrapperRef}
            className="relative h-[500px] md:h-[650px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl group"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div ref={imageRef} className="relative w-full h-full">
              <Image
                src="/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/12.webp"
                alt="Login visual"
                fill
                priority
                className="object-cover scale-105"
              />
            </div>

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Floating Caption inside 3D space */}
            <div className="absolute bottom-10 left-10" style={{ transform: "translateZ(50px)" }}>
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] uppercase tracking-[0.2em] mb-3">
                Featured Work
              </span>
              <h2 className="text-2xl font-light italic">
                "Every story begins with a frame"
              </h2>
              <p className="text-zinc-400 text-sm mt-1">Kutti Story Photography</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
