"use client";

import { useState } from "react";
import { X, User, MapPin, Heart, Phone, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: ProfileData) => void;
  initialData?: Partial<ProfileData>;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  preferredContact: "phone" | "whatsapp" | "email";
  weddingDate: string;
  partnerName: string;
  eventType: string;
  howDidYouHear: string;
}

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Contact & Address", icon: MapPin },
  { id: 3, title: "Event Details", icon: Heart },
];

export default function ProfileCompletionModal({
  isOpen,
  onClose,
  onComplete,
  initialData,
}: ProfileCompletionModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    pinCode: initialData?.pinCode || "",
    preferredContact: initialData?.preferredContact || "whatsapp",
    weddingDate: initialData?.weddingDate || "",
    partnerName: initialData?.partnerName || "",
    eventType: initialData?.eventType || "",
    howDidYouHear: initialData?.howDidYouHear || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
        newErrors.phone = "Enter a valid 10-digit phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const eventTypes = [
    "Wedding Photography",
    "Pre-Wedding Shoot",
    "Engagement",
    "Birthday Party",
    "Corporate Event",
    "Other",
  ];

  const hearAboutOptions = [
    "Google Search",
    "Instagram",
    "Facebook",
    "Friend/Family Referral",
    "Wedding Planner",
    "Other",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-800">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Help us serve you better by providing a few more details
          </p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                    currentStep === step.id
                      ? "bg-amber-500/10 text-amber-500"
                      : currentStep > step.id
                      ? "text-emerald-500"
                      : "text-zinc-500"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium hidden sm:block">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 sm:w-16 h-0.5 mx-2",
                      currentStep > step.id ? "bg-emerald-500" : "bg-zinc-700"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className={cn(
                      "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                      errors.firstName ? "border-red-500" : "border-zinc-700"
                    )}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-400 mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-xl text-zinc-400 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={cn(
                      "flex-1 px-4 py-3 bg-zinc-800/50 border rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                      errors.phone ? "border-red-500" : "border-zinc-700"
                    )}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                  Preferred Contact Method
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "whatsapp", label: "WhatsApp", icon: "💬" },
                    { value: "phone", label: "Phone Call", icon: "📞" },
                    { value: "email", label: "Email", icon: "✉️" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          preferredContact: option.value as any,
                        })
                      }
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all",
                        formData.preferredContact === option.value
                          ? "border-amber-500 bg-amber-500/10 text-amber-500"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <span>{option.icon}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Address */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                  Full Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none"
                  placeholder="Enter your full address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="Enter your state"
                  />
                </div>
              </div>

              <div className="w-1/2">
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={formData.pinCode}
                  onChange={(e) =>
                    setFormData({ ...formData, pinCode: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                  placeholder="Enter PIN code"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {/* Step 3: Event Details */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                  What type of event are you planning?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {eventTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, eventType: type })}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                        formData.eventType === type
                          ? "border-amber-500 bg-amber-500/10 text-amber-500"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                    Event / Wedding Date
                  </label>
                  <input
                    type="date"
                    value={formData.weddingDate}
                    onChange={(e) =>
                      setFormData({ ...formData, weddingDate: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                    Partner{"'"}s Name (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.partnerName}
                    onChange={(e) =>
                      setFormData({ ...formData, partnerName: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="Enter partner's name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                  How did you hear about us?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {hearAboutOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, howDidYouHear: option })
                      }
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                        formData.howDidYouHear === option
                          ? "border-amber-500 bg-amber-500/10 text-amber-500"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Skip for now
          </button>
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Saving...
                </>
              ) : currentStep === 3 ? (
                "Complete Profile"
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
