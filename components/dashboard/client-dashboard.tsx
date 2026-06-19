"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Camera,
  Save,
  RotateCcw,
  Upload,
  Clock,
  FileText,
  Settings,
  CreditCard,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  Edit3,
  LogOut,
  Bell,
  Heart,
  Star,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import FilesSection from "./files-section";
import HelpSection from "./help-section";
import OrdersSection from "./orders-section";
import PaymentsSection from "./payments-section";
import NotificationsSection from "./notifications-section";
import RequestedQuote from "./RequestedQuote";
import ProfileCompletionModal, { ProfileData } from "./ProfileCompletionModal";
import FavoritesSection from "./favorites-section";
import ReviewsSection from "./reviews-section";

const STORAGE_KEY = "userProfile"; // Declare the STORAGE_KEY variable

interface UserProfile {
  id?: number;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  preferredContact: "phone" | "whatsapp" | "email";
  profilePhoto: string | null;
  profileCompleted: boolean;
  weddingDate: string;
  partnerName: string;
  eventType: string;
  howDidYouHear: string;
  accountCreated: string;
  lastUpdated: string;
}

export default function ClientDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab");
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  
  // Map URL tab names to internal tab IDs
  const mapTabName = (tabName: string | null): string => {
    if (!tabName) return "general";
    // Map 'gallery' to 'files'
    if (tabName === "gallery") return "files";
    return tabName;
  };
  
  const [activeTab, setActiveTab] = useState(mapTabName(tabFromUrl));
  const [editPersonal, setEditPersonal] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Update tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(mapTabName(tabFromUrl));
    }
  }, [tabFromUrl]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    preferredContact: "whatsapp",
    profilePhoto: null,
    profileCompleted: false,
    weddingDate: "",
    partnerName: "",
    eventType: "",
    howDidYouHear: "",
    accountCreated: "",
    lastUpdated: "",
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  // Fetch user profile from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        
        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push("/login");
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          const userData = data.user;
          
          const profileData: UserProfile = {
            id: userData.id,
            fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`.trim(),
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            phone: userData.phone || "",
            email: userData.email || "",
            address: userData.address || "",
            city: userData.city || "",
            state: userData.state || "",
            pincode: userData.pincode || "",
            preferredContact: userData.preferredContact || "whatsapp",
            profilePhoto: userData.avatarUrl,
            profileCompleted: userData.profileCompleted || false,
            weddingDate: userData.weddingDate || "",
            partnerName: userData.partnerName || "",
            eventType: userData.eventType || "",
            howDidYouHear: userData.howDidYouHear || "",
            accountCreated: userData.createdAt ? new Date(userData.createdAt).toISOString().split("T")[0] : "",
            lastUpdated: userData.updatedAt ? new Date(userData.updatedAt).toISOString().split("T")[0] : "",
          };
      
          setProfile(profileData);
          setEditedProfile(profileData);
          
          // Show profile completion modal if profile not completed
          if (!userData.profileCompleted) {
            setShowProfileModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [router]);

  // Handle profile completion from modal
  const handleProfileComplete = async (data: ProfileData) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          profileCompleted: true,
        }),
      });
      
      if (response.ok) {
        const updatedProfile: UserProfile = {
          ...profile,
          ...data,
          fullName: `${data.firstName} ${data.lastName}`.trim(),
          profileCompleted: true,
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        
        setProfile(updatedProfile);
        setEditedProfile(updatedProfile);
        setEditPersonal(false);
        setEditAddress(false);
        setShowProfileModal(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Validation
  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editedProfile.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!editedProfile.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(editedProfile.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!editedProfile.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (editedProfile.pincode && !/^\d{6}$/.test(editedProfile.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit pin code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfile()) return;

    setIsSaving(true);

    try {
      // Split fullName into firstName and lastName
      const nameParts = editedProfile.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      console.log("Saving Profile Data:", {
      firstName,
      lastName,
      phone: editedProfile.phone,
      address: editedProfile.address,
      city: editedProfile.city,
      state: editedProfile.state,
      pincode: editedProfile.pincode,
    });

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: editedProfile.phone,
          address: editedProfile.address,
          city: editedProfile.city,
          state: editedProfile.state,
          pincode: editedProfile.pincode,
          preferredContact: editedProfile.preferredContact,
          weddingDate: editedProfile.weddingDate,
          partnerName: editedProfile.partnerName,
          eventType: editedProfile.eventType,
          howDidYouHear: editedProfile.howDidYouHear,
          profileCompleted: true,
        }),
      });

      if (response.ok) {
        const updatedProfile = {
          ...editedProfile,
          firstName,
          lastName,
          lastUpdated: new Date().toISOString().split("T")[0],
        };

        setProfile(updatedProfile);
        setEditedProfile(updatedProfile);
        setEditPersonal(false);
        setEditAddress(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setErrors({});
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile((prev) => ({
          ...prev,
          profilePhoto: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24">
      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
        initialData={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
          preferredContact: profile.preferredContact,
          weddingDate: profile.weddingDate,
          partnerName: profile.partnerName,
          eventType: profile.eventType,
          howDidYouHear: profile.howDidYouHear,
        }}
      />

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Profile updated successfully!</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden sticky top-24">
              {/* Profile Summary */}
              <div className="p-6 border-b border-zinc-800 bg-linear-to-br from-zinc-900 to-zinc-900/50">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-20 h-20 border-4 border-zinc-700 mb-4">
                    {profile.profilePhoto ? (
                      <AvatarImage src={profile.profilePhoto || "/placeholder.svg"} alt={profile.fullName} />
                    ) : (
                      <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xl font-medium">
                        {profile.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h2 className="text-lg font-bold">{profile.fullName}</h2>
                  <p className="text-sm text-zinc-500">{profile.email}</p>
                  <div className="mt-3 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <span className="text-[11px] font-bold text-green-500 uppercase tracking-wider">
                          Account Active
                        </span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-3">
                <ul className="space-y-1">
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
                        <tab.icon className="w-5 h-5" />
                        <span className="text-sm font-medium flex-1">{tab.label}</span>
                        {activeTab === tab.id && <ChevronRight className="w-4 h-4 text-amber-500" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-zinc-800">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-400 hover:bg-red-500/10 transition-all" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            {entityType && entityId && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                Opened from notification: {entityType} #{entityId}
              </div>
            )}
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">My Account</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                      Manage your personal information and preferences
                    </p>
                  </div>
                </div>

                {/* Profile Photo Section */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
                    Profile Photo
                  </h3>
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24 border-4 border-zinc-700">
                      {(isEditing ? editedProfile.profilePhoto : profile.profilePhoto) ? (
                        <AvatarImage
                          src={(isEditing ? editedProfile.profilePhoto : profile.profilePhoto) || ""}
                          alt={profile.fullName}
                        />
                      ) : (
                        <AvatarFallback className="bg-zinc-800 text-zinc-400 text-2xl font-medium">
                          {profile.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {isEditing && (
                      <div>
                        <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm font-medium">Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-zinc-500 mt-2">JPG, PNG or WebP. Max 2MB.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                 <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                   <User className="w-5 h-5 text-white" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                      Personal Information
                    </h3>
                   </div>

                  <button
                    onClick={() => setEditPersonal(!editPersonal)}
                     className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      {editPersonal ? (
                        <div>
                          <input
                            type="text"
                            value={editedProfile.fullName}
                            onChange={(e) =>
                              setEditedProfile((prev) => ({ ...prev, fullName: e.target.value }))
                            }
                            className={cn(
                              "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                              errors.fullName ? "border-red-500" : "border-zinc-700"
                            )}
                          />
                          {errors.fullName && (
                            <p className="text-[10px] text-red-400 mt-1">{errors.fullName}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-base font-medium">{profile.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                       {editPersonal ? (
                        <div>
                          <input
                            type="tel"
                            value={editedProfile.phone}
                            onChange={(e) =>
                              setEditedProfile((prev) => ({ ...prev, phone: e.target.value }))
                            }
                            className={cn(
                              "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                              errors.phone ? "border-red-500" : "border-zinc-700"
                            )}
                          />
                          {errors.phone && (
                            <p className="text-[10px] text-red-400 mt-1">{errors.phone}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-base font-medium">{profile.phone}</p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      {editPersonal ? (
                        <div>
                          <input
                            type="email"
                            value={editedProfile.email}
                            onChange={(e) =>
                              setEditedProfile((prev) => ({ ...prev, email: e.target.value }))
                            }
                            className={cn(
                              "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                              errors.email ? "border-red-500" : "border-zinc-700"
                            )}
                          />
                          {errors.email && (
                            <p className="text-[10px] text-red-400 mt-1">{errors.email}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-base font-medium">{profile.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                     <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                       Address Information
                     </h3>
                   </div>

                   <button
                     onClick={() => setEditAddress(!editAddress)}
                     className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                   >
                   <Edit3 className="w-4 h-4" />
                 </button>
                </div>
            
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Full Address
                      </label>
                      {editAddress ? (
                        <input
                          type="text"
                          value={editedProfile.address}
                          onChange={(e) =>
                            setEditedProfile((prev) => ({ ...prev, address: e.target.value }))
                          }
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                        />
                      ) : (
                        <p className="text-base font-medium">{profile.address || "Not provided"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        City
                      </label>
                      {editAddress ? (
                        <input
                          type="text"
                          value={editedProfile.city}
                          onChange={(e) =>
                            setEditedProfile((prev) => ({ ...prev, city: e.target.value }))
                          }
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                        />
                      ) : (
                        <p className="text-base font-medium">{profile.city || "Not provided"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        State
                      </label>
                      {editAddress ? (
                        <input
                          type="text"
                          value={editedProfile.state}
                          onChange={(e) =>
                            setEditedProfile((prev) => ({ ...prev, state: e.target.value }))
                          }
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                        />
                      ) : (
                        <p className="text-base font-medium">{profile.state || "Not provided"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Pin Code
                      </label>
                      {editAddress ? (
                        <div>
                          <input
                            type="text"
                            value={editedProfile.pincode}
                            onChange={(e) =>
                              setEditedProfile((prev) => ({ ...prev, pincode: e.target.value }))
                            }
                            className={cn(
                              "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                              errors.pincode ? "border-red-500" : "border-zinc-700"
                            )}
                          />
                          {errors.pincode && (
                            <p className="text-[10px] text-red-400 mt-1">{errors.pincode}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-base font-medium">{profile.pincode || "Not provided"}</p>
                      )}
                    </div>
                  </div>
                </div>
                {editAddress && (
                      <div className="flex justify-end mt-6">
                       <button
                         onClick={handleSave}
                         className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400"
                       >
                        Save Address
                       </button>
                      </div>
                    )}

                {/* Preferences */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <MessageCircle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                      Contact Preferences
                    </h3>
                  </div>
                  {editPersonal && (
                    <div className="flex justify-end mt-6">
                     <button
                       onClick={handleSave}
                       className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400"
                     >
                       Save Personal Info
                     </button>
                    </div>
                   )}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Preferred Contact Method
                    </label>
                    {editPersonal ? (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {[
                          { id: "phone", label: "Phone", icon: Phone },
                          { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                          { id: "email", label: "Email", icon: Mail },
                        ].map((method) => (
                          <button
                            key={method.id}
                            onClick={() =>
                              setEditedProfile((prev) => ({
                                ...prev,
                                preferredContact: method.id as "phone" | "whatsapp" | "email",
                              }))
                            }
                            className={cn(
                              "flex items-center gap-2 px-4 py-3 rounded-xl border transition-all",
                              editedProfile.preferredContact === method.id
                                ? "bg-amber-500 border-amber-500 text-black"
                                : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-600"
                            )}
                          >
                            <method.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{method.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        {profile.preferredContact === "phone" && <Phone className="w-4 h-4 text-amber-500" />}
                        {profile.preferredContact === "whatsapp" && (
                          <MessageCircle className="w-4 h-4 text-amber-500" />
                        )}
                        {profile.preferredContact === "email" && <Mail className="w-4 h-4 text-amber-500" />}
                        <p className="text-base font-medium capitalize">{profile.preferredContact}</p>
                      </div>
                    )}
                    </div>
                    </div>
                  
                {/* Account Info */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                      Account Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Account Created
                      </label>
                      <p className="text-base font-medium text-zinc-400">{formatDate(profile.accountCreated)}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Last Updated
                      </label>
                      <p className="text-base font-medium text-zinc-400">{formatDate(profile.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Requested Quotes Tab */}
            {activeTab === "quotes" && (
              <RequestedQuote />
            )}

            {/* Bookings Tab */}
            {activeTab === "bookings" && (
              <div className="space-y-6 animate-in fade-in duration-300">
               <OrdersSection />
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === "files" && (
              <FilesSection />
            )}

            {/* Favourites Tab */}
            {activeTab === "favorites" && (
              <FavoritesSection />
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <ReviewsSection />
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                < PaymentsSection />
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <NotificationsSection />
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-sm text-zinc-500 mt-1">Customize your account settings, security, and notifications</p>
                </div>

                {/* Security Section */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                      <div>
                        <p className="text-sm font-medium">Change Password</p>
                        <p className="text-[11px] text-zinc-500">Update your account password</p>
                      </div>
                      <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors">
                        Update
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">Two-Factor Authentication</p>
                        <p className="text-[11px] text-zinc-500">Add an extra layer of security</p>
                      </div>
                      <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-sm font-medium transition-colors">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Booking reminders", desc: "Get notified before your sessions" },
                      { label: "Gallery updates", desc: "When new photos are added to your gallery" },
                      { label: "Promotional offers", desc: "Special discounts and offers" },
                      { label: "Newsletter", desc: "Photography tips and studio updates" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-[11px] text-zinc-500">{item.desc}</p>
                        </div>
                        <button className="w-12 h-6 bg-amber-500 rounded-full relative">
                          <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Help Tab */}
            {activeTab === "help" && (
              <HelpSection />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}