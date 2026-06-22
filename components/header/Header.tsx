"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import {
  User,
  ShoppingBag,
  Heart,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Calendar,
  Images,
  Package,
  ChevronDown,
} from "lucide-react";
import NotificationBell from "@/components/notification-bell";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about-us" },
  { label: "Works", href: "/works" },
  { label: "Blog", href: "/blog" },
  { label: "faq", href: "/faq" },
  { label: "Services", href: "/services" },
  { label: "Contact us", href: "/contact-us" },
];

const accountMenuItems = [
  { label: "My Account", href: "/dashboard", icon: User },
  { label: "My Bookings", href: "/dashboard?tab=bookings", icon: Calendar },
  { label: "My Gallery", href: "/dashboard?tab=gallery", icon: Images },
  { label: "My Packages", href: "/dashboard?tab=packages", icon: Package },
  { label: "Favorites", href: "/dashboard?tab=favorites", icon: Heart },
  { label: "Payments", href: "/dashboard?tab=payments", icon: CreditCard },
  { label: "Settings", href: "/dashboard?tab=settings", icon: Settings },
];

export default function Header() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [logo, setLogo] = useState("/placeholder-logo.png");
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch auth status on mount and when 'auth:changed' event fires
    let mounted = true;

    const fetchAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!mounted) return;
        if (res.ok) {
        const data = await res.json();

        setIsAuthenticated(true);
        setUserRole(data.user.role);

        setUserName(
          `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim()
        );
      } else {
          setIsAuthenticated(false);
          setUserName(null);
        }
      } catch (err) {
        setIsAuthenticated(false);
        setUserName(null);
      }
    };

    fetchAuth();
    fetch("/api/homepage")
  .then((res) => res.json())
  .then((data) => {
    if (data.settings?.siteSettings?.logo) {
      setLogo(data.settings.siteSettings.logo);
    }
  })
  .catch(() => {});
    window.addEventListener('auth:changed', fetchAuth as EventListener);

    const header = headerRef.current;

    // 1. Entrance Magic: Staggered reveal
    const tl = gsap.timeline();
    tl.fromTo(header, 
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "expo.out" }
    );

    // 2. Hide on Scroll Down / Show on Scroll Up
    // We use a separate tween for the slide-up/down logic
    const showAnim = gsap.from(header, {
      yPercent: -100,
      paused: true,
      duration: 0.3,
      ease: "power2.out"
    }).progress(1);

    ScrollTrigger.create({
      start: "top top",
      end: 99999,
      onUpdate: (self) => {
        // Toggle background state for blur effect
        setIsScrolled(self.scroll() > 50);
        
        // Hide/Show logic
        if (self.direction === 1) {
          showAnim.reverse(); // Scrolling Down -> Hide
        } else {
          showAnim.play();    // Scrolling Up -> Show
        }
      }
    });

    return () => {
      mounted = false;
      window.removeEventListener('auth:changed', fetchAuth as EventListener);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Measure header height so mobile overlay can be positioned below it
  useEffect(() => {
    const updateHeight = () => {
      const h = headerRef.current?.offsetHeight ?? 0;
      setHeaderHeight(h);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setIsAuthenticated(false);
      setUserName(null);
      // close menus
      setIsAccountOpen(false);
      setIsMobileMenuOpen(false);
      router.push('/login');
    }
  };

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 w-full z-[999] transition-colors duration-500 ${
        isScrolled ? "bg-black/60 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-12 h-[70px] md:h-[80px] flex items-center justify-between">
        
        {/* LOGO: Matching your "Moments" Hero Typography */}
        <div className="flex items-center group cursor-pointer">
          <Image
            src={logo}
            alt="Kutti Story"
            width={100}
            height={400}
            className="h-10 md:h-14 w-auto object-contain"
          />
        </div>

        {/* NAV: Minimalist High-End Tracking */}
        <nav className="hidden md:flex items-center gap-10">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[11px] font-medium tracking-[0.25em] uppercase text-white/60 hover:text-white transition-all duration-300 relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>


        {/* Right Side: Notifications + Account Dropdown + Book Now */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && userRole === "admin" && (
            <NotificationBell className="text-white/70 hover:text-white transition-colors" />
        )}
          {!isAuthenticated ? (
            <Link href="/login" className="px-4 py-2.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300 text-sm font-medium">
              Sign In
            </Link>
          ) : null}
          {/* Account Dropdown */}
          {isAuthenticated ? (
            <div className="relative" ref={accountDropdownRef}>
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              onMouseEnter={() => setIsAccountOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300"
            >
              <User className="w-4 h-4" />
              <span className="text-[10px] font-medium tracking-[0.15em] uppercase">Account</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isAccountOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            <div
              onMouseLeave={() => setIsAccountOpen(false)}
              className={`absolute right-0 top-full mt-2 w-56 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
                isAccountOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                <p className="text-white text-sm font-medium">Welcome back!</p>
                <p className="text-white/50 text-xs">Manage your account</p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {accountMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Logout */}
              {isAuthenticated ? (
                <div className="border-t border-white/10 py-2">
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200">
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs font-medium tracking-wide cursor-pointer">Sign Out</span>
                  </button>
                </div>
              ) : null}
            </div>
            </div>
          ) : null}

          {/* Book Now CTA */}
          <Link
            href="/booking"
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-amber-400 border border-white hover:border-amber-400 transition-all duration-500"
          >
            Book Now
            <span className="text-lg">→</span>
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-white text-2xl p-2 z-50 relative transition-transform active:scale-95"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
        {isMobileMenuOpen && typeof document !== "undefined" && createPortal(
          <div
            className="md:hidden fixed left-0 right-0 bg-black/95 backdrop-blur-xl z-[998] overflow-y-auto"
            style={{ top: headerHeight, bottom: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex flex-col min-h-full" onClick={(e) => e.stopPropagation()}>
              {/* Nav Links */}
              <nav className="px-6 py-8 border-b border-white/10">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-4 text-lg font-medium tracking-wide text-white/80 hover:text-white active:text-amber-400 transition-colors border-b border-white/5"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Account Section */}
              <div className="px-6 py-6">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-4">My Account</p>
                <div className="grid grid-cols-2 gap-3">
                  {isAuthenticated ? (
                    accountMenuItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </Link>
                    ))
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="col-span-2 flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-xs font-medium">Sign In</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Book Now CTA - Mobile */}
              <div className="px-6 py-6 mt-auto">
                <Link
                  href="/booking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-full bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-amber-400 transition-all duration-300"
                >
                  Book Now
                  <span className="text-lg">→</span>
                </Link>
                {isAuthenticated ? (
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full mt-4 py-3 text-red-400 hover:text-red-300 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs font-medium tracking-wide cursor-pointer">Sign Out</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
