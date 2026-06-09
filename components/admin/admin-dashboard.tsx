"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users, Calendar, CreditCard, FileText, Bell, Settings,
  FolderOpen, ChevronRight, Search, LogOut, Camera, Menu, X,
  Receipt, Globe, Image, BookOpen, Quote, Layers, Phone, Star,
  HelpCircle,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import BookingsSection from "./sections/bookings-section";
import SettingsSection from "./sections/settings-section";
import ContactSection from "./sections/contact-section";
import SupportSection from "./sections/support-section";
import ClientsSection from "./sections/clients-section";
import PaymentsSection from "./sections/payments-section";
import ContentSection from "./sections/content-section";
import CalendarSection from "./sections/calendar-section";
import NotificationsSection from "./sections/notifications-section";
import FilesSection from "./sections/files-section";
import QuotesSection from "./sections/quotes-section";
import InvoicesPanel from "./sections/invoices-panel";
import HomepageSection from "./sections/homepage-section";
import AlbumsSection from "./sections/albums-section";
import ServicesSection from "./sections/services-section";
import MonthlyQuotesSection from "./sections/monthly-quotes-section";
import AboutSection from "./sections/about-section";
import ReviewsSection from "./sections/reviews-section";
import PhotographyCategoriesSection from "./sections/photography-categories-section";
import FaqSection from "./sections/faq-section";

const sidebarTabs = [
  { id: "quotes",         label: "Quotes",           icon: FileText   },
  { id: "bookings",       label: "Bookings",          icon: Calendar   },
  { id: "clients",        label: "Clients",           icon: Users      },
  { id: "payments",       label: "Payments",          icon: CreditCard },
  { id: "invoices",       label: "Invoices",          icon: Receipt    },
  { id: "photography_categories", label: "Photography Categories", icon: Camera     },
  { id: "content",        label: "Portfolio",         icon: Camera     },
  { id: "albums",         label: "Albums",            icon: Layers     },
  { id: "reviews",        label: "Reviews",           icon: Star       },
  { id: "services",       label: "Services",          icon: BookOpen   },
  { id: "homepage",       label: "Homepage",          icon: Globe      },
  { id: "about",          label: "About Page",        icon: Image      },
  { id: "monthly_quotes", label: "Monthly Quotes",    icon: Quote      },
  { id: "calendar",       label: "Calendar",          icon: Calendar   },
  { id: "files",          label: "Files",             icon: FolderOpen },
  { id: "notifications",  label: "Notifications",     icon: Bell       },
  { id: "support",        label: "Support Tickets",   icon: HelpCircle },
  { id: "settings",       label: "Settings",          icon: Settings   },
  { id: "contact",        label: "Contact Details",   icon: Phone      },
  { id: "faq", label: "FAQ Page", icon: HelpCircle },
];

const UNREAD_THROTTLE_MS = 60_000;

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("quotes");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [adminUser, setAdminUser] = useState<{ firstName?: string; email?: string; avatarUrl?: string } | null>(null);
  const lastFetchedAt = React.useRef<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const [notifRes, supportRes] = await Promise.all([
        fetch("/api/notifications?unread=true"),
        fetch("/api/support"),
      ]);
      if (notifRes.ok) {
        const data = await notifRes.json();
        setUnreadNotificationCount(Number(data.unreadCount || 0));
      }
      if (supportRes.ok) {
        const data = await supportRes.json();
        const unread = (data.tickets || []).reduce((sum: number, t: any) => sum + (t.adminUnread || 0), 0);
        setUnreadSupportCount(unread);
      }
      lastFetchedAt.current = Date.now();
    } catch {}
  };

  useEffect(() => {
    fetchUnreadCount();
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.user) setAdminUser(d.user); }).catch(() => {});
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - lastFetchedAt.current > UNREAD_THROTTLE_MS) fetchUnreadCount();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (tabFromUrl && sidebarTabs.some((t) => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
    router.push(`/admin?tab=${tabId}`, { scroll: false });
    if (tabId === "notifications") setUnreadNotificationCount(0);
    if (tabId === "support") setUnreadSupportCount(0);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "quotes": return <QuotesSection />;
      case "bookings": return <BookingsSection />;
      case "clients": return <ClientsSection />;
      case "payments": return <PaymentsSection />;
      case "invoices": return <InvoicesPanel openModalSignal={0} />;
      case "photography_categories": return <PhotographyCategoriesSection />;
      case "content": return <ContentSection />;
      case "albums": return <AlbumsSection />;
      case "reviews": return <ReviewsSection />;
      case "services": return <ServicesSection />;
      case "homepage": return <HomepageSection />;
      case "about":    return <AboutSection />;
      case "monthly_quotes": return <MonthlyQuotesSection />;
      case "calendar": return <CalendarSection />;
      case "files": return <FilesSection />;
      case "notifications": return <NotificationsSection />;
      case "settings": return <SettingsSection />;
      case "contact": return <ContactSection />;
      case "support": return <SupportSection />;
      case "faq": return <FaqSection />;
      default: return <QuotesSection />;
    }
  };

  const initials = adminUser?.firstName
    ? adminUser.firstName.slice(0, 1).toUpperCase()
    : "A";

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-lg border border-zinc-800"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-40 transition-transform duration-300",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Camera className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">Kutti Story</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {sidebarTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.id === "notifications" && unreadNotificationCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                )}
                {tab.id === "support" && unreadSupportCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold animate-pulse">
                    {unreadSupportCount > 99 ? "99+" : unreadSupportCount}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8">
              {adminUser?.avatarUrl && <AvatarImage src={adminUser.avatarUrl} />}
              <AvatarFallback className="bg-amber-500 text-black text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{adminUser?.firstName || "Admin"}</p>
              <p className="text-[11px] text-zinc-500 truncate">{adminUser?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}