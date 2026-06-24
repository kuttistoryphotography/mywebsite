"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import {
  User, ShoppingBag, Heart, CreditCard, Bell,
  Settings, LogOut, Calendar, Images, Package,
  ChevronDown, Menu, X,
} from "lucide-react";
import NotificationBell from "@/components/notification-bell";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const navItems = [
  { label: "Home",       href: "/" },
  { label: "About",      href: "/about-us" },
  { label: "Works",      href: "/works" },
  { label: "Blog",       href: "/blog" },
  { label: "FAQ",        href: "/faq" },
  { label: "Services",   href: "/services" },
  { label: "Contact",    href: "/contact-us" },
];

const accountMenuItems = [
  { label: "My Account",  href: "/dashboard",                   icon: User },
  { label: "My Bookings", href: "/dashboard?tab=bookings",      icon: Calendar },
  { label: "My Gallery",  href: "/dashboard?tab=gallery",       icon: Images },
  { label: "My Packages", href: "/dashboard?tab=packages",      icon: Package },
  { label: "Favorites",   href: "/dashboard?tab=favorites",     icon: Heart },
  { label: "Payments",    href: "/dashboard?tab=payments",      icon: CreditCard },
  { label: "Settings",    href: "/dashboard?tab=settings",      icon: Settings },
];

export default function Header() {
  const headerRef          = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const router             = useRouter();
  const pathname           = usePathname();

  const [isScrolled,       setIsScrolled]       = useState(false);
  const [isAccountOpen,    setIsAccountOpen]    = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated,  setIsAuthenticated]  = useState(false);
  const [userRole,         setUserRole]         = useState<string | null>(null);
  const [userName,         setUserName]         = useState<string | null>(null);
  const [logo,             setLogo]             = useState("/placeholder-logo.png");
  const [headerHeight,     setHeaderHeight]     = useState(0);
  const [mounted,          setMounted]          = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountOpen(false);
  }, [pathname]);

  // Mount guard for portal
  useEffect(() => { setMounted(true); }, []);

  // Click-outside for desktop dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auth + logo fetch + GSAP
  useEffect(() => {
    let alive = true;

    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!alive) return;
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          setUserRole(data.user.role);
          setUserName(`${data.user.first_name || ""} ${data.user.last_name || ""}`.trim());
        } else {
          setIsAuthenticated(false);
          setUserName(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUserName(null);
      }
    };

    fetchAuth();

    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.siteSettings?.logo) setLogo(data.settings.siteSettings.logo);
      })
      .catch(() => {});

    window.addEventListener("auth:changed", fetchAuth as EventListener);

    // GSAP entrance
    const header = headerRef.current;
    const tl = gsap.timeline();
    tl.fromTo(header, { y: -100, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "expo.out" });

    const showAnim = gsap.from(header, {
      yPercent: -100, paused: true, duration: 0.3, ease: "power2.out",
    }).progress(1);

    ScrollTrigger.create({
      start: "top top",
      end: 99999,
      onUpdate: (self) => {
        setIsScrolled(self.scroll() > 50);
        if (self.direction === 1) showAnim.reverse();
        else showAnim.play();
      },
    });

    return () => {
      alive = false;
      window.removeEventListener("auth:changed", fetchAuth as EventListener);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Body scroll lock when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  // Track header height for mobile overlay positioning
  useEffect(() => {
    const update = () => setHeaderHeight(headerRef.current?.offsetHeight ?? 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    setIsAuthenticated(false);
    setUserName(null);
    setIsAccountOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 w-full z-[999] transition-all duration-500 ${
        isScrolled
          ? "bg-black/75 backdrop-blur-lg border-b border-white/10 shadow-xl shadow-black/20"
          : "bg-transparent"
      }`}
    >
      {/* ─── INNER WRAPPER ─── */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 h-[64px] sm:h-[70px] lg:h-[80px] flex items-center justify-between gap-4">

        {/* ── LOGO ── */}
        <Link href="/" className="flex items-center flex-shrink-0 z-10">
          <Image
            src={logo}
            alt="Kutti Story Photography"
            width={140}
            height={50}
            className="h-8 sm:h-9 lg:h-11 w-auto object-contain"
            priority
          />
        </Link>

        {/* ── DESKTOP + LAPTOP NAV (lg 1024px+) ── */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`relative px-3 xl:px-4 py-2 text-[10px] xl:text-[11px] font-semibold tracking-[0.2em] xl:tracking-[0.25em] uppercase transition-all duration-300 group ${
                isActive(item.href)
                  ? "text-white"
                  : "text-white/55 hover:text-white"
              }`}
            >
              {item.label}
              <span
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-white transition-all duration-300 ${
                  isActive(item.href) ? "w-4/5" : "w-0 group-hover:w-4/5"
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* ── TABLET NAV (md 768px → lg 1023px): abbreviated ── */}
        <nav className="hidden md:flex lg:hidden items-center gap-0.5 flex-1 justify-center">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`relative px-2.5 py-2 text-[9px] font-semibold tracking-[0.15em] uppercase transition-all duration-300 group ${
                isActive(item.href) ? "text-white" : "text-white/55 hover:text-white"
              }`}
            >
              {item.label}
              <span
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-white transition-all duration-300 ${
                  isActive(item.href) ? "w-4/5" : "w-0 group-hover:w-4/5"
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* ── RIGHT: ACTIONS ── */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

          {/* Notification bell — desktop + tablet, admin only */}
          {isAuthenticated && userRole === "admin" && (
            <div className="hidden md:flex">
              <NotificationBell className="text-white/70 hover:text-white transition-colors" />
            </div>
          )}

          {/* Sign In — desktop + tablet */}
          {!isAuthenticated && (
            <Link
              href="/login"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition-all duration-300 text-[11px] font-medium tracking-wide"
            >
              <User className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}

          {/* Account dropdown — desktop + tablet */}
          {isAuthenticated && (
            <div className="hidden md:block relative" ref={accountDropdownRef}>
              <button
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                onMouseEnter={() => setIsAccountOpen(true)}
                className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[10px] font-semibold tracking-[0.15em] uppercase">
                  {userName ? userName.split(" ")[0] : "Account"}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-300 ${isAccountOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown */}
              <div
                onMouseLeave={() => setIsAccountOpen(false)}
                className={`absolute right-0 top-full mt-2 w-56 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
                  isAccountOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                  <p className="text-white text-sm font-semibold truncate">
                    {userName || "Welcome back!"}
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">Manage your account</p>
                </div>
                <div className="py-2">
                  {accountMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
                    </Link>
                  ))}
                </div>
                <div className="border-t border-white/10 py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[11px] font-medium tracking-wide">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Book Now — hidden on mobile (<md), shown md+ */}
          <Link
            href="/booking"
            className="hidden md:inline-flex items-center gap-2 px-4 xl:px-6 py-2 xl:py-2.5 rounded-full bg-white text-black text-[10px] xl:text-[11px] font-bold uppercase tracking-widest hover:bg-amber-400 border border-white hover:border-amber-400 transition-all duration-400 whitespace-nowrap"
          >
            Book Now
            <span className="text-base leading-none">→</span>
          </Link>

          {/* ── MOBILE HAMBURGER (< md 768px) ── */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 active:scale-95 transition-all duration-300 z-[1000]"
          >
            <span
              className={`block w-5 h-px bg-white transition-all duration-300 origin-center ${
                isMobileMenuOpen ? "rotate-45 translate-y-[6px]" : ""
              }`}
            />
            <span
              className={`block h-px bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "w-0 opacity-0" : "w-4"
              }`}
            />
            <span
              className={`block w-5 h-px bg-white transition-all duration-300 origin-center ${
                isMobileMenuOpen ? "-rotate-45 -translate-y-[6px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════
          MOBILE FULL-SCREEN MENU OVERLAY
          (320px – 767px)
      ══════════════════════════════ */}
      {mounted && isMobileMenuOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[998] md:hidden"
            style={{ top: headerHeight }}
            aria-modal="true"
            role="dialog"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Panel */}
            <div className="relative bg-[#0a0a0a] border-t border-white/10 h-full overflow-y-auto flex flex-col">

              {/* ── Nav links ── */}
              <nav className="px-5 pt-6 pb-4 border-b border-white/[0.07]">
                <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/30 mb-4 px-1">
                  Navigation
                </p>
                <div className="flex flex-col gap-1">
                  {navItems.map((item, i) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-semibold tracking-wide transition-all duration-200 ${
                        isActive(item.href)
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/5 active:bg-white/10"
                      }`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {item.label}
                      {isActive(item.href) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      )}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* ── Account section ── */}
              <div className="px-5 pt-5 pb-4 border-b border-white/[0.07]">
                <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/30 mb-4 px-1">
                  {isAuthenticated ? (userName ? `Hi, ${userName.split(" ")[0]}` : "My Account") : "Account"}
                </p>

                {isAuthenticated ? (
                  <div className="grid grid-cols-2 gap-2">
                    {accountMenuItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/65 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all duration-200"
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0 text-white/50" />
                        <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    Sign In to Your Account
                  </Link>
                )}
              </div>

              {/* ── Bottom CTAs ── */}
              <div className="px-5 py-5 mt-auto space-y-3">
                {/* Admin notification bell */}
                {isAuthenticated && userRole === "admin" && (
                  <div className="flex items-center justify-center py-2">
                    <NotificationBell className="text-white/70 hover:text-white transition-colors" />
                  </div>
                )}

                {/* Book Now */}
                <Link
                  href="/booking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-amber-400 active:scale-[0.98] transition-all duration-300"
                >
                  Book a Session
                  <span className="text-lg leading-none">→</span>
                </Link>

                {/* Sign out */}
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 active:scale-[0.98] transition-all duration-300 text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
