"use client";

import { useState, useEffect } from "react";
import { Camera, Video, Package, Megaphone, Check, Plane, Clock, Users, Sparkles, ImageIcon, Film } from "lucide-react";

const CATEGORY_TYPES = {
  GENERAL: "Photography",
  WEDDING: "Wedding Services",
  OUTDOOR: "Outdoor Photography",
  BABY: "Baby Shoots",
  FOOD: "Food Photography",
  ADS_PHOTO: "Ads Photography",
  PRODUCT: "Product Photography",
  AD_SHOOT: "Ad Shoot",
};

const CATEGORIES = [
  {
    name: CATEGORY_TYPES.GENERAL,
    icon: Camera,
    description: "Professional photography services",
  },
  {
    name: CATEGORY_TYPES.WEDDING,
    icon: Users,
    description: "Capture your special day",
  },
  {
    name: CATEGORY_TYPES.OUTDOOR,
    icon: Camera,
    description: "Nature & outdoor portraits",
  },
  {
    name: CATEGORY_TYPES.BABY,
    icon: Camera,
    description: "Precious baby moments",
  },
  {
    name: CATEGORY_TYPES.FOOD,
    icon: Camera,
    description: "Delicious food styling shots",
  },
  {
    name: CATEGORY_TYPES.ADS_PHOTO,
    icon: Megaphone,
    description: "Creative advertising content",
  },
  {
    name: CATEGORY_TYPES.PRODUCT,
    icon: Package,
    description: "Showcase your products",
  },
  {
    name: CATEGORY_TYPES.AD_SHOOT,
    icon: Megaphone,
    description: "Creative advertising content",
  },
];

const STORAGE_KEY = "kutti-story-booking-form";

// Validation helpers
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => /^[0-9]{10}$/.test(phone.replace(/\s/g, ""));
const validatePin = (pin: string) => /^[0-9]{6}$/.test(pin);

type FormErrors = {
  name?: string;
  phone?: string;
  email?: string;
  pin?: string;
  weddingDate?: string;
  weddingServices?: string;
  productItems?: string;
  productDate?: string;
  productDelivery?: string;
  adTitle?: string;
  adDate?: string;
};

export default function BookingForm({ onSuccess, isDialog = false }: { onSuccess?: () => void; isDialog?: boolean } = {}) {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [mainCategory, setMainCategory] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAnimating, setIsAnimating] = useState(false);

  const [formData, setFormData] = useState({
    user: { name: "", phone: "", email: "", address: "", city: "", state: "", pin: "" },
    wedding: {
      date: "",
      startTime: "",
      endTime: "",
      venueName: "",
      venueAddress: "",
      services: [] as string[],
      videographyAddons: [] as string[],
      photographyAddons: [] as string[],
    },
    products: {
      items: [{ name: "", count: "", notes: "" }],
      expectedDate: "",
      preferredTimeSlot: "",
      sampleDelivery: "" as "" | "courier" | "bring-to-location",
    },
    adShoot: { title: "", description: "", date: "", timeSlot: "", notes: "" },
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || formData);
        setMainCategory(parsed.mainCategory || "");
        setStep(parsed.step || 1);
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, mainCategory, step }));
  }, [formData, mainCategory, step]);

  // Clear storage on success
  useEffect(() => {
    if (success) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [success]);

  /* -------------------- VALIDATION -------------------- */

  const validateStep1 = () => {
    const newErrors: FormErrors = {};
    if (!formData.user.name.trim()) newErrors.name = "Name is required";
    if (!formData.user.phone.trim()) newErrors.phone = "Phone is required";
    else if (!validatePhone(formData.user.phone)) newErrors.phone = "Enter valid 10-digit phone";
    if (!formData.user.email.trim()) newErrors.email = "Email is required";
    else if (!validateEmail(formData.user.email)) newErrors.email = "Enter valid email";
    if (!formData.user.pin.trim()) newErrors.pin = "Pin code is required";
    else if (!validatePin(formData.user.pin)) newErrors.pin = "Enter valid 6-digit pin";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: FormErrors = {};
  
    if (isWeddingCategory) {
      if (!formData.wedding.date) {
        newErrors.weddingDate = "Shoot date is required";
      }
  
      if (formData.wedding.services.length === 0) {
        newErrors.weddingServices =
          "Select at least one service";
      }
    }
  
    if (isProductCategory) {
      if (!formData.products.items[0].name) {
        newErrors.productItems =
          "Add at least one product";
      }
  
      if (!formData.products.expectedDate) {
        newErrors.productDate =
          "Expected date is required";
      }
  
      if (!formData.products.sampleDelivery) {
        newErrors.productDelivery =
          "Select delivery method";
      }
    }
  
    if (isAdCategory) {
      if (!formData.adShoot.title) {
        newErrors.adTitle =
          "Project title is required";
      }
  
      if (!formData.adShoot.date) {
        newErrors.adDate =
          "Shoot date is required";
      }
    }
  
    setErrors(newErrors);
  
    return Object.keys(newErrors).length === 0;
  };

  const isStepComplete = (stepNum: number) => {
    if (stepNum === 1) {
      return (
        formData.user.name &&
        validatePhone(formData.user.phone) &&
        validatePin(formData.user.pin)
      );
    }
  
    if (stepNum === 2) return !!mainCategory;
  
    if (stepNum === 3) {
      if (isWeddingCategory) {
        return (
          formData.wedding.date &&
          formData.wedding.services.length > 0
        );
      }
  
      if (isProductCategory) {
        return (
          formData.products.items[0].name &&
          formData.products.expectedDate &&
          formData.products.sampleDelivery
        );
      }
  
      if (isAdCategory) {
        return (
          formData.adShoot.title &&
          formData.adShoot.date
        );
      }
    }
  
    return false;
  };

  /* -------------------- LOGIC HANDLERS -------------------- */

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 3 && !validateStep3()) return;
    setIsAnimating(true);
    setTimeout(() => {
      setStep((prev) => prev + 1);
      setIsAnimating(false);
    }, 150);
  };

  const prevStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep((prev) => prev - 1);
      setIsAnimating(false);
    }, 150);
  };

  const toggleWeddingService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      wedding: {
        ...prev.wedding,
        services: prev.wedding.services.includes(service)
          ? prev.wedding.services.filter((s) => s !== service)
          : [...prev.wedding.services, service],
        ...(prev.wedding.services.includes(service) && service === "Wedding Videography" ? { videographyAddons: [] } : {}),
        ...(prev.wedding.services.includes(service) && service === "Wedding Photography" ? { photographyAddons: [] } : {}),
      },
    }));
    setErrors((prev) => ({ ...prev, weddingServices: undefined }));
  };

  const toggleVideographyAddon = (addon: string) => {
    setFormData((prev) => ({
      ...prev,
      wedding: {
        ...prev.wedding,
        videographyAddons: prev.wedding.videographyAddons.includes(addon)
          ? prev.wedding.videographyAddons.filter((a) => a !== addon)
          : [...prev.wedding.videographyAddons, addon],
      },
    }));
  };

  const togglePhotographyAddon = (addon: string) => {
    setFormData((prev) => ({
      ...prev,
      wedding: {
        ...prev.wedding,
        photographyAddons: prev.wedding.photographyAddons.includes(addon)
          ? prev.wedding.photographyAddons.filter((a) => a !== addon)
          : [...prev.wedding.photographyAddons, addon],
      },
    }));
  };

  const handleProductChange = (index: number, field: string, value: string) => {
    const updatedProducts = [...formData.products.items];
    updatedProducts[index][field as keyof (typeof updatedProducts)[0]] = value;
    setFormData({ ...formData, products: { ...formData.products, items: updatedProducts } });
    setErrors((prev) => ({ ...prev, productItems: undefined }));
  };

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: { ...formData.products, items: [...formData.products.items, { name: "", count: "", notes: "" }] },
    });
  };

  const removeProductRow = (index: number) => {
    if (formData.products.items.length > 1) {
      const updated = formData.products.items.filter((_, i) => i !== index);
      setFormData({ ...formData, products: { ...formData.products, items: updated } });
    }
  };

  const handleSubmit = () => {
    (async () => {
      // Build payload for Quote Request API (not direct booking)
      const payload: any = {
        client_name: formData.user.name,
        client_email: formData.user.email,
        client_phone: formData.user.phone,
        service_type: mainCategory,
        event_date: getEventDate(),
        event_time: mainCategory === 'Wedding Services' ? formData.wedding.startTime : null,
        event_location: mainCategory === 'Wedding Services' ? formData.wedding.venueName : null,
        event_city: formData.user.city || null,
        description: getDescription(),
        budget_range: null, // Can be added later if needed
      };

      try {
        // Submit as QUOTE REQUEST, not direct booking
        const res = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.status === 401) {
          // Not authenticated: send user to login/signup
          if (confirm('You need to be signed in to request a quote. Sign in now?')) {
            window.location.href = '/login';
            return;
          } else {
            return;
          }
        }

        if (!res.ok) {
          let errorMessage = 'Failed to submit quote request';
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If response is not JSON, use default error
          }
          alert(errorMessage);
          return;
        }

        const data = await res.json();
        console.log('Quote request created', data);
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        console.error('Quote request submit error', err);
        alert('Failed to submit quote request. Please try again.');
      }
    })();
  };

  const TIME_SLOTS = ["Morning (9AM - 12PM)", "Afternoon (12PM - 4PM)", "Evening (4PM - 7PM)", "Full Day"];

  const isWeddingCategory = [
    CATEGORY_TYPES.WEDDING,
    CATEGORY_TYPES.OUTDOOR,
    CATEGORY_TYPES.BABY,
    CATEGORY_TYPES.GENERAL,
  ].includes(mainCategory);
  
  const isProductCategory =
    mainCategory === CATEGORY_TYPES.PRODUCT;
  
  const isAdCategory = [
    CATEGORY_TYPES.ADS_PHOTO,
    CATEGORY_TYPES.AD_SHOOT,
  ].includes(mainCategory);
  
  const getEventDate = () => {
    if (isWeddingCategory) return formData.wedding.date;
    if (isProductCategory) return formData.products.expectedDate;
    if (isAdCategory) return formData.adShoot.date;
    return "";
  };
  
  const getDescription = () => {
    if (isWeddingCategory) {
      return [
        ...formData.wedding.services,
        ...formData.wedding.photographyAddons,
        ...formData.wedding.videographyAddons,
      ].join(", ");
    }
  
    if (isProductCategory) {
      return formData.products.items
        .map((i) => `${i.count}x ${i.name}`)
        .join("; ");
    }
  
    if (isAdCategory) {
      return formData.adShoot.description || null;
    }
  
    return null;
  };
  /* -------------------- UI RENDER -------------------- */

  if (success) {
    return (
      <section className={isDialog ? "bg-transparent flex items-center justify-center p-6" : "min-h-screen bg-zinc-950 flex items-center justify-center p-6"}>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-white">Quote Request Submitted!</h2>
          <p className="text-zinc-400 mt-2">We&apos;ve received your request. Our team will review and send you a customized quote within 24 hours.</p>
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
            <p className="text-sm text-amber-400 font-medium mb-2">What happens next?</p>
            <ul className="text-xs text-zinc-400 space-y-1">
              <li>✓ We&apos;ll review your requirements</li>
              <li>✓ You&apos;ll receive a customized quote</li>
              <li>✓ Negotiate and finalize the price</li>
              <li>✓ Once accepted, your booking is confirmed!</li>
            </ul>
          </div>
          <button onClick={() => isDialog ? setSuccess(false) : window.location.href = '/dashboard'} className="mt-8 w-full bg-white text-zinc-900 py-4 px-6 rounded-xl font-semibold hover:bg-zinc-100 transition-colors">
            Go to Dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={isDialog ? "bg-transparent" : "min-h-screen bg-zinc-950 flex"}>
      {/* Left Side - Image */}
      {!isDialog && (
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950/50 z-10" />
          <img
            src="/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/12.webp"
            alt="Wedding photography"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent">
            <h2 className="text-4xl font-bold text-white mb-3">Kutti Story Photography</h2>
            <p className="text-zinc-400 text-lg">Capturing moments that last forever</p>
          </div>
        </div>
      )}

      {/* Right Side - Form */}
      <div className={isDialog ? "w-full" : "w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8"}>
        <div className={isDialog ? "w-full" : "bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden"}>
          {/* Header */}
          <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">Kutti Story Photography</h1>
              <p className="text-sm text-zinc-500">Step {step} of 4</p>
            </div>
            {/* Progress Indicators */}
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    s < step || (s === step && isStepComplete(s))
                      ? "bg-emerald-500 text-white"
                      : s === step
                        ? "bg-white text-zinc-900"
                        : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
              ))}
            </div>
          </div>

          <div className={`p-8 transition-all duration-150 ${isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
            {/* STEP 1: PERSONAL INFORMATION */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-white">Contact Details</h2>
                  <p className="text-zinc-500 text-sm mt-1">Tell us how to reach you</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      className={`input-field ${errors.name ? "border-red-500" : ""}`}
                      placeholder="Full Name"
                      value={formData.user.name}
                      onChange={(e) => {
                        setFormData({ ...formData, user: { ...formData.user, name: e.target.value } });
                        setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                    />
                    {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <input
                      className={`input-field ${errors.phone ? "border-red-500" : ""}`}
                      placeholder="10-digit number"
                      value={formData.user.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, user: { ...formData.user, phone: e.target.value } });
                        setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                    />
                    {errors.phone && <p className="text-red-400 text-xs">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Email <span className="text-red-400">*</span></label>
                    <input
                      className={`input-field ${errors.email ? "border-red-500" : ""}`}
                      placeholder="example@email.com"
                      value={formData.user.email}
                      onChange={(e) => {
                        setFormData({ ...formData, user: { ...formData.user, email: e.target.value } });
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                    />
                    {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">
                      Pin Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      className={`input-field ${errors.pin ? "border-red-500" : ""}`}
                      placeholder="6-digit pin"
                      value={formData.user.pin}
                      onChange={(e) => {
                        setFormData({ ...formData, user: { ...formData.user, pin: e.target.value } });
                        setErrors((prev) => ({ ...prev, pin: undefined }));
                      }}
                    />
                    {errors.pin && <p className="text-red-400 text-xs">{errors.pin}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Address</label>
                  <input
                    className="input-field"
                    placeholder="Full Address (optional)"
                    value={formData.user.address}
                    onChange={(e) => setFormData({ ...formData, user: { ...formData.user, address: e.target.value } })}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button onClick={nextStep} className="btn-primary">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CATEGORY SELECTION */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-white">Select Service</h2>
                  <p className="text-zinc-500 text-sm mt-1">What can we help you with?</p>
                </div>

                <div className="space-y-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => setMainCategory(cat.name)}
                        className={`w-full p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                          mainCategory === cat.name
                            ? "border-white bg-white text-zinc-900"
                            : "border-zinc-800 bg-zinc-800/50 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <div className={`p-3 rounded-lg ${mainCategory === cat.name ? "bg-zinc-900" : "bg-zinc-700"}`}>
                          <Icon className={`w-5 h-5 ${mainCategory === cat.name ? "text-white" : "text-zinc-300"}`} />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold block">{cat.name}</span>
                          <span className={`text-sm ${mainCategory === cat.name ? "text-zinc-600" : "text-zinc-500"}`}>{cat.description}</span>
                        </div>
                        {mainCategory === cat.name && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between">
                  <button onClick={prevStep} className="btn-secondary">
                    Back
                  </button>
                  <button disabled={!mainCategory} onClick={nextStep} className="btn-primary">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DYNAMIC CONFIGURATION */}
            {step === 3 && (
              <div className="space-y-6">
                {/* WEDDING SERVICES */}
                { isWeddingCategory && (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Wedding Details</h2>
                      <p className="text-zinc-500 text-sm mt-1">Configure your wedding coverage</p>
                    </div>

                    {/* Service Selection */}
                    <div className="space-y-3">
                      <label className="text-xs font-medium text-zinc-400">
                        Services <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: "Wedding Videography", icon: Video },
                          { name: "Wedding Photography", icon: Camera },
                        ].map((service) => {
                          const Icon = service.icon;
                          const isSelected = formData.wedding.services.includes(service.name);
                          return (
                            <button
                              key={service.name}
                              onClick={() => toggleWeddingService(service.name)}
                              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                isSelected ? "border-white bg-white text-zinc-900" : "border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700"
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                              <span className="text-xs font-semibold text-center">{service.name.replace("Wedding ", "")}</span>
                              {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                            </button>
                          );
                        })}
                      </div>
                      {errors.weddingServices && <p className="text-red-400 text-xs">{errors.weddingServices}</p>}
                    </div>

                    {/* Videography Addons */}
                    {formData.wedding.services.includes("Wedding Videography") && (
                      <div className="space-y-3 pl-4 border-l-2 border-zinc-700">
                        <label className="text-xs font-medium text-zinc-400">Videography Add-ons</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: "Drone Shoot", icon: Plane },
                            { name: "Storytelling Video", icon: Film },
                            { name: "Candid Videography", icon: Sparkles },
                          ].map((addon) => {
                            const Icon = addon.icon;
                            const isSelected = formData.wedding.videographyAddons.includes(addon.name);
                            return (
                              <button
                                key={addon.name}
                                onClick={() => toggleVideographyAddon(addon.name)}
                                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                                  isSelected ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {addon.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Photography Addons */}
                    {formData.wedding.services.includes("Wedding Photography") && (
                      <div className="space-y-3 pl-4 border-l-2 border-zinc-700">
                        <label className="text-xs font-medium text-zinc-400">Photography Add-ons</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: "Candid Photography", icon: Sparkles },
                            { name: "Storytelling Photography", icon: ImageIcon },
                            { name: "Traditional Photography", icon: Camera },
                          ].map((addon) => {
                            const Icon = addon.icon;
                            const isSelected = formData.wedding.photographyAddons.includes(addon.name);
                            return (
                              <button
                                key={addon.name}
                                onClick={() => togglePhotographyAddon(addon.name)}
                                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                                  isSelected ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {addon.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">
                          Wedding Date <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          className={`input-field ${errors.weddingDate ? "border-red-500" : ""}`}
                          value={formData.wedding.date}
                          onChange={(e) => {
                            setFormData({ ...formData, wedding: { ...formData.wedding, date: e.target.value } });
                            setErrors((prev) => ({ ...prev, weddingDate: undefined }));
                          }}
                        />
                        {errors.weddingDate && <p className="text-red-400 text-xs">{errors.weddingDate}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Start Time</label>
                        <input
                          type="time"
                          className="input-field"
                          value={formData.wedding.startTime}
                          onChange={(e) => setFormData({ ...formData, wedding: { ...formData.wedding, startTime: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">End Time</label>
                        <input
                          type="time"
                          className="input-field"
                          value={formData.wedding.endTime}
                          onChange={(e) => setFormData({ ...formData, wedding: { ...formData.wedding, endTime: e.target.value } })}
                        />
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Venue Name</label>
                        <input
                          className="input-field"
                          placeholder="Hotel / Resort name"
                          value={formData.wedding.venueName}
                          onChange={(e) => setFormData({ ...formData, wedding: { ...formData.wedding, venueName: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Venue Address</label>
                        <input
                          className="input-field"
                          placeholder="Full venue address"
                          value={formData.wedding.venueAddress}
                          onChange={(e) => setFormData({ ...formData, wedding: { ...formData.wedding, venueAddress: e.target.value } })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* PRODUCT PHOTOGRAPHY */}
                { isProductCategory && (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Product Details</h2>
                      <p className="text-zinc-500 text-sm mt-1">Tell us about your products</p>
                    </div>

                    {/* Products List */}
                    <div className="space-y-3">
                      <label className="text-xs font-medium text-zinc-400">
                        Products <span className="text-red-400">*</span>
                      </label>
                      {formData.products.items.map((p, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-zinc-800/50 p-3 rounded-xl border border-zinc-800">
                          <div className="col-span-5">
                            <input placeholder="Product Name" className="input-field-sm" value={p.name} onChange={(e) => handleProductChange(i, "name", e.target.value)} />
                          </div>
                          <div className="col-span-2">
                            <input placeholder="Qty" type="number" className="input-field-sm" value={p.count} onChange={(e) => handleProductChange(i, "count", e.target.value)} />
                          </div>
                          <div className="col-span-4">
                            <input placeholder="Notes" className="input-field-sm" value={p.notes} onChange={(e) => handleProductChange(i, "notes", e.target.value)} />
                          </div>
                          <div className="col-span-1 text-right">
                            <button onClick={() => removeProductRow(i)} className="text-zinc-500 hover:text-red-400 font-bold text-lg">
                              &times;
                            </button>
                          </div>
                        </div>
                      ))}
                      {errors.productItems && <p className="text-red-400 text-xs">{errors.productItems}</p>}
                      <button onClick={addProductRow} className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                        + Add Another Product
                      </button>
                    </div>

                    {/* Expected Date & Time Slot */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">
                          Expected Date <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          className={`input-field ${errors.productDate ? "border-red-500" : ""}`}
                          value={formData.products.expectedDate}
                          onChange={(e) => {
                            setFormData({ ...formData, products: { ...formData.products, expectedDate: e.target.value } });
                            setErrors((prev) => ({ ...prev, productDate: undefined }));
                          }}
                        />
                        {errors.productDate && <p className="text-red-400 text-xs">{errors.productDate}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Preferred Time Slot</label>
                        <select
                          className="input-field"
                          value={formData.products.preferredTimeSlot}
                          onChange={(e) => setFormData({ ...formData, products: { ...formData.products, preferredTimeSlot: e.target.value } })}
                        >
                          <option value="">Select time slot</option>
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Sample Delivery */}
                    <div className="space-y-3">
                      <label className="text-xs font-medium text-zinc-400">
                        How will you send your products? <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setFormData({ ...formData, products: { ...formData.products, sampleDelivery: "courier" } });
                            setErrors((prev) => ({ ...prev, productDelivery: undefined }));
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            formData.products.sampleDelivery === "courier"
                              ? "border-white bg-white text-zinc-900"
                              : "border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <Package className={`w-5 h-5 mb-2 ${formData.products.sampleDelivery === "courier" ? "text-zinc-900" : "text-zinc-500"}`} />
                          <span className="font-semibold text-sm block">Sent by Courier</span>
                          <span className={`text-xs ${formData.products.sampleDelivery === "courier" ? "text-zinc-600" : "text-zinc-500"}`}>We&apos;ll receive via delivery</span>
                        </button>
                        <button
                          onClick={() => {
                            setFormData({ ...formData, products: { ...formData.products, sampleDelivery: "bring-to-location" } });
                            setErrors((prev) => ({ ...prev, productDelivery: undefined }));
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            formData.products.sampleDelivery === "bring-to-location"
                              ? "border-white bg-white text-zinc-900"
                              : "border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <Users className={`w-5 h-5 mb-2 ${formData.products.sampleDelivery === "bring-to-location" ? "text-zinc-900" : "text-zinc-500"}`} />
                          <span className="font-semibold text-sm block">Bring to Our Location</span>
                          <span className={`text-xs ${formData.products.sampleDelivery === "bring-to-location" ? "text-zinc-600" : "text-zinc-500"}`}>
                            Drop off at our studio
                          </span>
                        </button>
                      </div>
                      {errors.productDelivery && <p className="text-red-400 text-xs">{errors.productDelivery}</p>}
                    </div>
                  </>
                )}

                {/* AD SHOOT */}
                { isAdCategory && (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Ad Project Details</h2>
                      <p className="text-zinc-500 text-sm mt-1">Tell us about your project</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">
                        Project Title / Brand <span className="text-red-400">*</span>
                      </label>
                      <input
                        className={`input-field ${errors.adTitle ? "border-red-500" : ""}`}
                        placeholder="Brand or campaign name"
                        value={formData.adShoot.title}
                        onChange={(e) => {
                          setFormData({ ...formData, adShoot: { ...formData.adShoot, title: e.target.value } });
                          setErrors((prev) => ({ ...prev, adTitle: undefined }));
                        }}
                      />
                      {errors.adTitle && <p className="text-red-400 text-xs">{errors.adTitle}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Project Description</label>
                      <textarea
                        className="input-field h-24 resize-none"
                        placeholder="Tell us about your project vision..."
                        value={formData.adShoot.description}
                        onChange={(e) => setFormData({ ...formData, adShoot: { ...formData.adShoot, description: e.target.value } })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">
                          Preferred Shoot Date <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          className={`input-field ${errors.adDate ? "border-red-500" : ""}`}
                          value={formData.adShoot.date}
                          onChange={(e) => {
                            setFormData({ ...formData, adShoot: { ...formData.adShoot, date: e.target.value } });
                            setErrors((prev) => ({ ...prev, adDate: undefined }));
                          }}
                        />
                        {errors.adDate && <p className="text-red-400 text-xs">{errors.adDate}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Preferred Time Slot</label>
                        <select
                          className="input-field"
                          value={formData.adShoot.timeSlot}
                          onChange={(e) => setFormData({ ...formData, adShoot: { ...formData.adShoot, timeSlot: e.target.value } })}
                        >
                          <option value="">Select time slot</option>
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 flex justify-between">
                  <button onClick={prevStep} className="btn-secondary">
                    Back
                  </button>
                  <button onClick={nextStep} className="btn-primary">
                    Review
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: FINAL SUMMARY */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Review & Confirm</h2>
                  <p className="text-zinc-500 text-sm mt-1">Please verify your booking details</p>
                </div>

                <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-700">
                    <span className="text-xs text-zinc-500">Service</span>
                    <span className="font-semibold text-white">{mainCategory}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-700">
                    <span className="text-xs text-zinc-500">Client</span>
                    <span className="font-semibold text-white">{formData.user.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-700">
                    <span className="text-xs text-zinc-500">Contact</span>
                    <span className="font-semibold text-white">{formData.user.phone}</span>
                  </div>

                  <div className="text-sm text-zinc-400 pt-2 space-y-2">
                    { isWeddingCategory && (
                      <>
                        <p>
                          <span className="text-zinc-500">Date:</span> {formData.wedding.date}
                          {formData.wedding.startTime && ` (${formData.wedding.startTime} - ${formData.wedding.endTime || "TBD"})`}
                        </p>
                        <p>
                          <span className="text-zinc-500">Venue:</span> {formData.wedding.venueName || "Not specified"}
                        </p>
                        <p>
                          <span className="text-zinc-500">Services:</span> {formData.wedding.services.join(", ")}
                        </p>
                        {formData.wedding.videographyAddons.length > 0 && (
                          <p>
                            <span className="text-zinc-500">Video Add-ons:</span> {formData.wedding.videographyAddons.join(", ")}
                          </p>
                        )}
                        {formData.wedding.photographyAddons.length > 0 && (
                          <p>
                            <span className="text-zinc-500">Photo Add-ons:</span> {formData.wedding.photographyAddons.join(", ")}
                          </p>
                        )}
                      </>
                    )}
                    { isProductCategory && (
                      <>
                        <p>
                          <span className="text-zinc-500">Products:</span> {formData.products.items.length} item(s)
                        </p>
                        <p>
                          <span className="text-zinc-500">Expected Date:</span> {formData.products.expectedDate}
                        </p>
                        {formData.products.preferredTimeSlot && (
                          <p>
                            <span className="text-zinc-500">Time Slot:</span> {formData.products.preferredTimeSlot}
                          </p>
                        )}
                        <p>
                          <span className="text-zinc-500">Delivery:</span>{" "}
                          {formData.products.sampleDelivery === "courier" ? "Sent by Courier" : "Bring to Our Location"}
                        </p>
                      </>
                    )}
                    { isAdCategory && (
                      <>
                        <p>
                          <span className="text-zinc-500">Project:</span> {formData.adShoot.title}
                        </p>
                        <p>
                          <span className="text-zinc-500">Date:</span> {formData.adShoot.date}
                        </p>
                        {formData.adShoot.timeSlot && (
                          <p>
                            <span className="text-zinc-500">Time Slot:</span> {formData.adShoot.timeSlot}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button onClick={prevStep} className="btn-secondary">
                    Edit Details
                  </button>
                  <button onClick={handleSubmit} className="btn-primary bg-emerald-500 hover:bg-emerald-600">
                    Request Quote
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #3f3f46;
          border-radius: 12px;
          font-size: 14px;
          background: #27272a;
          color: white;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: #fff;
          outline: none;
          background: #3f3f46;
        }
        .input-field::placeholder {
          color: #71717a;
        }

        .input-field-sm {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          font-size: 12px;
          background: #27272a;
          color: white;
        }
        .input-field-sm::placeholder {
          color: #71717a;
        }

        .btn-primary {
          background: #fff;
          color: #18181b;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background: #e4e4e7;
        }
        .btn-primary:disabled {
          background: #3f3f46;
          color: #71717a;
          cursor: not-allowed;
        }

        .btn-secondary {
          color: #a1a1aa;
          padding: 12px 24px;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          color: #fff;
        }
      `}</style>
    </section>
  );
}