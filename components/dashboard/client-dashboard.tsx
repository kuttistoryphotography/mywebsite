"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User, MapPin, Calendar, Phone, Mail, MessageCircle,
  Save, RotateCcw, Upload, Clock, FileText, Settings,
  CreditCard, HelpCircle, ChevronRight, CheckCircle2,
  Edit3, LogOut, Bell, Heart, Star, X, Menu, ChevronDown,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import FilesSection           from "./files-section";
import HelpSection            from "./help-section";
import OrdersSection          from "./orders-section";
import PaymentsSection        from "./payments-section";
import NotificationsSection   from "./notifications-section";
import RequestedQuote         from "./RequestedQuote";
import ProfileCompletionModal, { ProfileData } from "./ProfileCompletionModal";
import FavoritesSection       from "./favorites-section";
import ReviewsSection         from "./reviews-section";

interface UserProfile {
  id?: number;
  fullName: string; firstName: string; lastName: string;
  phone: string; email: string;
  address: string; city: string; state: string; pincode: string;
  preferredContact: "phone" | "whatsapp" | "email";
  profilePhoto: string | null; profileCompleted: boolean;
  weddingDate: string; partnerName: string; eventType: string;
  howDidYouHear: string; accountCreated: string; lastUpdated: string;
}

const sidebarTabs = [
  { id: "general",       label: "General",          icon: User        },
  { id: "quotes",        label: "Requested Quotes", icon: FileText    },
  { id: "bookings",      label: "My Bookings",      icon: Calendar    },
  { id: "favorites",     label: "My Favourites",    icon: Heart       },
  { id: "reviews",       label: "My Reviews",       icon: Star        },
  { id: "files",         label: "My Files",         icon: FileText    },
  { id: "payments",      label: "Payments",         icon: CreditCard  },
  { id: "notifications", label: "Notifications",    icon: Bell        },
  { id: "settings",      label: "Settings",         icon: Settings    },
  { id: "help",          label: "Help & Support",   icon: HelpCircle  },
];

const mapTabName = (t: string | null) => (t === "gallery" ? "files" : (t || "general"));

export default function ClientDashboard() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const tabFromUrl   = searchParams.get("tab");
  const entityType   = searchParams.get("entityType");
  const entityId     = searchParams.get("entityId");

  const [activeTab,        setActiveTab]        = useState(mapTabName(tabFromUrl));
  const [sidebarOpen,      setSidebarOpen]      = useState(false); // mobile drawer
  const [isEditing,        setIsEditing]        = useState(false);
  const [editPersonal,     setEditPersonal]     = useState(false);
  const [editAddress,      setEditAddress]      = useState(false);
  const [isLoading,        setIsLoading]        = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSaving,         setIsSaving]         = useState(false);
  const [showSuccess,      setShowSuccess]      = useState(false);
  const [errors,           setErrors]           = useState<Record<string, string>>({});

  const drawerRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<UserProfile>({
    fullName: "", firstName: "", lastName: "",
    phone: "", email: "",
    address: "", city: "", state: "", pincode: "",
    preferredContact: "whatsapp", profilePhoto: null, profileCompleted: false,
    weddingDate: "", partnerName: "", eventType: "", howDidYouHear: "",
    accountCreated: "", lastUpdated: "",
  });
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  /* URL → tab sync */
  useEffect(() => { if (tabFromUrl) setActiveTab(mapTabName(tabFromUrl)); }, [tabFromUrl]);

  /* Close mobile drawer on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  /* Lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  /* Fetch profile */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.status === 401) { router.push("/login"); return; }
        if (res.ok) {
          const { user: u } = await res.json();
          const p: UserProfile = {
            id: u.id,
            fullName: u.fullName || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
            firstName: u.firstName || "", lastName: u.lastName || "",
            phone: u.phone || "", email: u.email || "",
            address: u.address || "", city: u.city || "", state: u.state || "", pincode: u.pincode || "",
            preferredContact: u.preferredContact || "whatsapp",
            profilePhoto: u.avatarUrl, profileCompleted: u.profileCompleted || false,
            weddingDate: u.weddingDate || "", partnerName: u.partnerName || "",
            eventType: u.eventType || "", howDidYouHear: u.howDidYouHear || "",
            accountCreated: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "",
            lastUpdated: u.updatedAt   ? new Date(u.updatedAt).toISOString().split("T")[0]  : "",
          };
          setProfile(p); setEditedProfile(p);
          if (!u.profileCompleted) setShowProfileModal(true);
        }
      } catch {}
      finally { setIsLoading(false); }
    })();
  }, [router]);

  const handleProfileComplete = async (data: ProfileData) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, profileCompleted: true }),
      });
      if (res.ok) {
        const updated: UserProfile = {
          ...profile, ...data,
          fullName: `${data.firstName} ${data.lastName}`.trim(),
          profileCompleted: true,
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        setProfile(updated); setEditedProfile(updated);
        setShowProfileModal(false); setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch {}
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    router.push("/login");
  };

  const validateProfile = () => {
    const e: Record<string, string> = {};
    if (!editedProfile.fullName.trim()) e.fullName = "Full name is required";
    if (!editedProfile.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(editedProfile.phone)) e.phone = "Enter a valid 10-digit phone number";
    if (!editedProfile.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) e.email = "Enter a valid email address";
    if (editedProfile.pincode && !/^\d{6}$/.test(editedProfile.pincode)) e.pincode = "Enter a valid 6-digit pin code";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfile()) return;
    setIsSaving(true);
    try {
      const parts = editedProfile.fullName.trim().split(" ");
      const res = await fetch("/api/user/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "",
          phone: editedProfile.phone, address: editedProfile.address,
          city: editedProfile.city, state: editedProfile.state, pincode: editedProfile.pincode,
          preferredContact: editedProfile.preferredContact,
          weddingDate: editedProfile.weddingDate, partnerName: editedProfile.partnerName,
          eventType: editedProfile.eventType, howDidYouHear: editedProfile.howDidYouHear,
          profileCompleted: true,
        }),
      });
      if (res.ok) {
        const updated = { ...editedProfile, lastUpdated: new Date().toISOString().split("T")[0] };
        setProfile(updated); setEditedProfile(updated);
        setEditPersonal(false); setEditAddress(false);
        setIsEditing(false); setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch {} finally { setIsSaving(false); }
  };

  const handleCancel = () => { setEditedProfile(profile); setErrors({}); setIsEditing(false); };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEditedProfile((p) => ({ ...p, profilePhoto: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const activeTabMeta = sidebarTabs.find((t) => t.id === activeTab);

  const navigateTab = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  /* ── avatar initials ── */
  const initials = profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-16 md:pt-20">
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
        initialData={{
          firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone,
          address: profile.address, city: profile.city, state: profile.state, pincode: profile.pincode,
          preferredContact: profile.preferredContact, weddingDate: profile.weddingDate,
          partnerName: profile.partnerName, eventType: profile.eventType, howDidYouHear: profile.howDidYouHear,
        }}
      />

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-[60] animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 shadow-xl">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Profile updated successfully!</span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR (< lg)
          Always visible, shows 5 most-used tabs
      ════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 safe-area-bottom">
        <div className="flex items-center justify-around px-1 pt-2 pb-3">
          {/* Pinned quick tabs */}
          {[
            { id: "general",   icon: User,       label: "Profile"  },
            { id: "bookings",  icon: Calendar,   label: "Bookings" },
            { id: "files",     icon: FileText,   label: "Files"    },
            { id: "payments",  icon: CreditCard, label: "Payments" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => navigateTab(t.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[56px]",
                activeTab === t.id
                  ? "text-amber-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <t.icon className={cn("w-5 h-5 transition-transform", activeTab === t.id && "scale-110")} />
              <span className="text-[10px] font-semibold leading-none">{t.label}</span>
              {activeTab === t.id && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </button>
          ))}

          {/* "More" button → opens full drawer */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[56px]",
              sidebarOpen ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-semibold leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          MOBILE FULL-SCREEN DRAWER
      ════════════════════════════════════════ */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer panel — slides from left */}
          <div
            ref={drawerRef}
            className="relative w-[82vw] max-w-xs bg-zinc-900 border-r border-zinc-800 h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-left duration-300"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 border-2 border-zinc-700">
                  {profile.profilePhoto
                    ? <AvatarImage src={profile.profilePhoto} alt={profile.fullName} />
                    : <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm font-bold">{initials}</AvatarFallback>
                  }
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{profile.fullName || "My Account"}</p>
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Active</span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 p-3 space-y-1">
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-zinc-600 px-3 pt-2 pb-1">
                Navigation
              </p>
              {sidebarTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigateTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all",
                    activeTab === tab.id
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white active:scale-[0.98]"
                  )}
                >
                  <tab.icon className={cn("w-5 h-5 flex-shrink-0", activeTab === tab.id && "text-amber-400")} />
                  <span className="text-sm font-semibold flex-1">{tab.label}</span>
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4 text-amber-500" />}
                </button>
              ))}
            </nav>

            {/* Drawer logout */}
            <div className="p-3 border-t border-zinc-800 pb-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          ACTIVE TAB MOBILE HEADER BAR (< lg)
          Shown above content, below the main nav
      ════════════════════════════════════════ */}
      <div className="lg:hidden sticky top-[64px] z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3 flex items-center gap-3">
        {activeTabMeta && <activeTabMeta.icon className="w-4 h-4 text-amber-400 flex-shrink-0" />}
        <span className="text-sm font-bold text-white">{activeTabMeta?.label}</span>
        <button
          onClick={() => setSidebarOpen(true)}
          className="ml-auto flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-zinc-500 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
          Menu
        </button>
      </div>

      {/* ════════════════════════════════════════
          MAIN LAYOUT
      ════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-28 lg:pb-10">
        <div className="flex gap-8">

          {/* ── SIDEBAR (desktop lg+) ── */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden sticky top-24">
              {/* Profile summary */}
              <div className="p-6 border-b border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/60">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-20 h-20 border-4 border-zinc-700 mb-4">
                    {profile.profilePhoto
                      ? <AvatarImage src={profile.profilePhoto} alt={profile.fullName} />
                      : <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xl font-medium">{initials}</AvatarFallback>
                    }
                  </Avatar>
                  <h2 className="text-lg font-bold leading-tight">{profile.fullName || "My Account"}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-full px-2">{profile.email}</p>
                  <div className="mt-3 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Account Active</span>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="p-3">
                <ul className="space-y-0.5">
                  {sidebarTabs.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                          activeTab === tab.id
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        )}
                      >
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">{tab.label}</span>
                        {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 text-amber-500" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-zinc-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0">
            {entityType && entityId && (
              <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                Opened from notification: {entityType} #{entityId}
              </div>
            )}

            {/* ── GENERAL TAB ── */}
            {activeTab === "general" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold">My Account</h1>
                    <p className="text-xs text-zinc-500 mt-0.5">Manage your personal information and preferences</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors flex-shrink-0 text-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline font-medium">Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-sm">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline font-medium">Cancel</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl transition-colors disabled:opacity-50 text-sm"
                      >
                        {isSaving
                          ? <><div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /><span className="hidden sm:inline font-medium">Saving…</span></>
                          : <><Save className="w-3.5 h-3.5" /><span className="hidden sm:inline font-medium">Save</span></>
                        }
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Photo */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Profile Photo</h3>
                  <div className="flex items-center gap-5">
                    <Avatar className="w-20 h-20 border-4 border-zinc-700 flex-shrink-0">
                      {(isEditing ? editedProfile.profilePhoto : profile.profilePhoto)
                        ? <AvatarImage src={(isEditing ? editedProfile.profilePhoto : profile.profilePhoto) || ""} alt={profile.fullName} />
                        : <AvatarFallback className="bg-zinc-800 text-zinc-400 text-2xl font-medium">{initials}</AvatarFallback>
                      }
                    </Avatar>
                    {isEditing && (
                      <div>
                        <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl cursor-pointer transition-colors text-sm">
                          <Upload className="w-4 h-4" />
                          <span className="font-medium">Upload Photo</span>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                        <p className="text-[10px] text-zinc-500 mt-2">JPG, PNG or WebP. Max 2MB.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-white" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Personal Information</h3>
                    </div>
                    <button onClick={() => setEditPersonal(!editPersonal)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "fullName", label: "Full Name", type: "text", required: true, span: false },
                      { key: "phone",    label: "Phone Number", type: "tel", required: true, span: false },
                      { key: "email",    label: "Email Address", type: "email", required: true, span: true },
                    ].map(({ key, label, type, required, span }) => (
                      <div key={key} className={cn("space-y-2", span && "sm:col-span-2")}>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          {label} {required && <span className="text-red-400">*</span>}
                        </label>
                        {editPersonal ? (
                          <div>
                            <input
                              type={type}
                              value={(editedProfile as any)[key]}
                              onChange={(e) => setEditedProfile((p) => ({ ...p, [key]: e.target.value }))}
                              className={cn(
                                "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                                (errors as any)[key] ? "border-red-500" : "border-zinc-700"
                              )}
                            />
                            {(errors as any)[key] && <p className="text-[10px] text-red-400 mt-1">{(errors as any)[key]}</p>}
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-white/90">{(profile as any)[key] || <span className="text-zinc-600">Not provided</span>}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {editPersonal && (
                    <div className="flex justify-end mt-4">
                      <button onClick={handleSave} className="px-4 py-2 bg-amber-500 text-black rounded-xl hover:bg-amber-400 text-sm font-bold transition-colors">
                        Save Personal Info
                      </button>
                    </div>
                  )}
                </div>

                {/* Address Information */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Address Information</h3>
                    </div>
                    <button onClick={() => setEditAddress(!editAddress)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "address", label: "Full Address", span: true },
                      { key: "city",    label: "City",         span: false },
                      { key: "state",   label: "State",        span: false },
                      { key: "pincode", label: "Pin Code",     span: false },
                    ].map(({ key, label, span }) => (
                      <div key={key} className={cn("space-y-2", span && "sm:col-span-2")}>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</label>
                        {editAddress ? (
                          <div>
                            <input
                              type="text"
                              value={(editedProfile as any)[key]}
                              onChange={(e) => setEditedProfile((p) => ({ ...p, [key]: e.target.value }))}
                              className={cn(
                                "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                                (errors as any)[key] ? "border-red-500" : "border-zinc-700"
                              )}
                            />
                            {(errors as any)[key] && <p className="text-[10px] text-red-400 mt-1">{(errors as any)[key]}</p>}
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-white/90">{(profile as any)[key] || <span className="text-zinc-600">Not provided</span>}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {editAddress && (
                    <div className="flex justify-end mt-4">
                      <button onClick={handleSave} className="px-4 py-2 bg-amber-500 text-black rounded-xl hover:bg-amber-400 text-sm font-bold transition-colors">
                        Save Address
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact Preferences */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <MessageCircle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Contact Preferences</h3>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Preferred Contact Method</label>
                    {editPersonal ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { id: "phone",     label: "Phone",     icon: Phone          },
                          { id: "whatsapp",  label: "WhatsApp",  icon: MessageCircle  },
                          { id: "email",     label: "Email",     icon: Mail           },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setEditedProfile((p) => ({ ...p, preferredContact: m.id as any }))}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all",
                              editedProfile.preferredContact === m.id
                                ? "bg-amber-500 border-amber-500 text-black font-bold"
                                : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                            )}
                          >
                            <m.icon className="w-4 h-4" /> {m.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        {profile.preferredContact === "phone"    && <Phone className="w-4 h-4 text-amber-500" />}
                        {profile.preferredContact === "whatsapp" && <MessageCircle className="w-4 h-4 text-amber-500" />}
                        {profile.preferredContact === "email"    && <Mail className="w-4 h-4 text-amber-500" />}
                        <p className="text-sm font-medium capitalize">{profile.preferredContact}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Account Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Account Created</label>
                      <p className="text-sm font-medium text-zinc-400">{formatDate(profile.accountCreated)}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Last Updated</label>
                      <p className="text-sm font-medium text-zinc-400">{formatDate(profile.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "quotes"        && <RequestedQuote />}
            {activeTab === "bookings"      && <div className="animate-in fade-in duration-300"><OrdersSection /></div>}
            {activeTab === "files"         && <FilesSection />}
            {activeTab === "favorites"     && <FavoritesSection />}
            {activeTab === "reviews"       && <ReviewsSection />}
            {activeTab === "payments"      && <div className="animate-in fade-in duration-300"><PaymentsSection /></div>}
            {activeTab === "notifications" && <NotificationsSection />}
            {activeTab === "help"          && <HelpSection />}

            {activeTab === "settings" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Customize your account settings, security, and notifications</p>
                </div>
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Security</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Change Password",            desc: "Update your account password",      action: "Update", variant: "secondary" },
                      { label: "Two-Factor Authentication",  desc: "Add an extra layer of security",    action: "Enable",  variant: "primary"   },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0 gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-[11px] text-zinc-500">{item.desc}</p>
                        </div>
                        <button className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0",
                          item.variant === "primary"
                            ? "bg-amber-500 hover:bg-amber-600 text-black"
                            : "bg-zinc-800 hover:bg-zinc-700"
                        )}>
                          {item.action}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Notifications</h3>
                  <div className="space-y-1">
                    {[
                      { label: "Booking reminders",  desc: "Get notified before your sessions"         },
                      { label: "Gallery updates",    desc: "When new photos are added to your gallery" },
                      { label: "Promotional offers", desc: "Special discounts and offers"               },
                      { label: "Newsletter",         desc: "Photography tips and studio updates"        },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-3.5 border-b border-zinc-800 last:border-0 gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-[11px] text-zinc-500">{item.desc}</p>
                        </div>
                        <button className="w-11 h-6 bg-amber-500 rounded-full relative flex-shrink-0">
                          <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
