"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import Script from "next/script";

export default function SignupSection() {
  const formRef = useRef(null);
  const imageRef = useRef(null);
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  console.log(
    "CLIENT ID:",
    process.env
      .NEXT_PUBLIC_GOOGLE_CLIENT_ID
  );
  // GOOGLE LOGIN
  const handleGoogleResponse = useCallback(
    async (response) => {
      if (!response?.credential) {
        setError("Google sign-up failed");
        return;
      }

      setGoogleLoading(true);
      setError("");

      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: response.credential,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Google signup failed");
          setGoogleLoading(false);
          return;
        }

        window.dispatchEvent(new Event("auth:changed"));

        router.push("/dashboard");
      } catch (error) {
        console.error(error);

        setError("Something went wrong");

        setGoogleLoading(false);
      }
    },
    [router]
  );

  // INITIALIZE GOOGLE
  useEffect(() => {
    const initializeGoogle = () => {
      if (
        typeof window === "undefined" ||
        !window.google ||
        !window.google.accounts
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id:
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      const buttonDiv = document.getElementById(
        "google-signup-button"
      );

      if (buttonDiv) {
        buttonDiv.innerHTML = "";

        window.google.accounts.id.renderButton(
          buttonDiv,
          {
            theme: "filled_black",
            size: "large",
            width: 320,
            text: "signup_with",
            shape: "rectangular",
          }
        );
      }
    };

    const interval = setInterval(() => {
      if (window.google) {
        initializeGoogle();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [handleGoogleResponse]);

  // GSAP
  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      formRef.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power4.out",
      }
    ).fromTo(
      imageRef.current,
      { opacity: 0, scale: 1.05 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power4.out",
      },
      "-=0.6"
    );
  }, []);

  // EMAIL SIGNUP
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const nameParts = fullName.trim().split(" ");

    const firstName = nameParts[0] || "";

    const lastName =
      nameParts.slice(1).join(" ") || "";

    try {
      const response = await fetch(
        "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);

      setError("An error occurred");

      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-black text-white flex items-center px-6 md:px-20 py-24">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* LEFT */}
        <div ref={formRef} className="max-w-md">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Create Account
          </h1>

          <p className="text-zinc-400 mb-8">
            Join Kutti Story Photography
          </p>

          {/* GOOGLE BUTTON */}
          <div className="mb-6">
            <div
              id="google-signup-button"
              className="w-full flex justify-center"
            />

            {googleLoading && (
              <p className="text-center text-sm text-zinc-500 mt-2">
                Signing up with Google...
              </p>
            )}
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-zinc-800" />

            <span className="text-xs text-zinc-500 uppercase">
              or sign up with email
            </span>

            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
                {error}
              </div>
            )}

            {/* NAME */}
            <div className="mb-5">
              <label className="block text-sm text-zinc-400 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="Your name"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition"
                required
              />
            </div>

            {/* EMAIL */}
            <div className="mb-5">
              <label className="block text-sm text-zinc-400 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="mb-5">
              <label className="block text-sm text-zinc-400 mb-2">
                Password
              </label>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition"
                required
              />
            </div>

            {/* CONFIRM */}
            <div className="mb-5">
              <label className="block text-sm text-zinc-400 mb-2">
                Confirm Password
              </label>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition"
                required
              />
            </div>

            {/* SHOW PASSWORD */}
            <div className="flex items-center gap-2 mb-8">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) =>
                  setShowPassword(
                    e.target.checked
                  )
                }
              />

              <label className="text-sm text-zinc-400">
                Show password
              </label>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {loading
                ? "Creating Account..."
                : "Sign Up"}
            </button>
          </form>

          {/* LOGIN */}
          <p className="text-sm text-zinc-400 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-white underline"
            >
              Login
            </Link>
          </p>
        </div>

        {/* RIGHT IMAGE */}
        <div
          ref={imageRef}
          className="relative hidden md:block h-[560px] rounded-[32px] overflow-hidden"
        >
          <Image
            src="/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/12.webp"
            alt="Signup visual"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 bg-black/40" />

          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-lg font-medium">
              Start your journey with us
            </p>

            <p className="text-sm text-zinc-300">
              Kutti Story Photography
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}