"use client";

import React, { useRef, useState } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Trash2,
} from "lucide-react";

interface OrderCancelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelled?: (details: { bookingStatus: string; currentStatus: string; cancellationReason: string }) => void;
  orderNumber: string;
  orderId: string;
}

interface CancelFormData {
  subject: string;
  details: string;
  image: File | null;
  imagePreview: string | null;
}

export default function OrderCancelForm({
  isOpen,
  onClose,
  onCancelled,
  orderNumber,
  orderId,
}: OrderCancelFormProps) {
  const [formData, setFormData] = useState<CancelFormData>({
    subject: "",
    details: "",
    image: null,
    imagePreview: null,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({ subject: "", details: "", image: null, imagePreview: null });
    setIsSubmitted(false);
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2MB");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null, imagePreview: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const subject = formData.subject.trim();
    const details = formData.details.trim();

    if (!subject) {
      setError("Please enter a subject");
      return;
    }
    if (!details) {
      setError("Please provide details for your cancellation request");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          action: "cancel",
          subject,
          details,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Failed to cancel this booking");
        return;
      }

      onCancelled?.({
        bookingStatus: data.booking?.bookingStatus || "cancelled",
        currentStatus: data.booking?.currentStatus || "processing",
        cancellationReason: data.booking?.cancellationReason || `${subject}\n\n${details}`,
      });
      setIsSubmitted(true);
    } catch (submitError) {
      console.error("Failed to cancel booking:", submitError);
      setError("Failed to cancel this booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {isSubmitted ? (
          // Success State
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Booking Cancelled</h3>
            <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto">
              Your booking has been cancelled successfully and the admin team has been notified.
            </p>
            <p className="text-xs text-zinc-500 mt-4">
              Order: #{orderNumber}
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          // Form State
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Cancel Order</h3>
                  <p className="text-xs text-zinc-500">Order #{orderNumber}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <p className="text-sm text-zinc-400">
                Please let us know why you would like to cancel this order. Our team will review your request.
              </p>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Change of plans, Found another service..."
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
              </div>

              {/* Details */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Details <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData((prev) => ({ ...prev, details: e.target.value }))}
                  placeholder="Please provide more details about your cancellation request..."
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Attachment (Optional)
                </label>
                <p className="text-[10px] text-zinc-500">Upload an image if needed. Max 2MB. Attachments are preview-only for now.</p>

                {formData.imagePreview ? (
                  <div className="relative">
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-700">
                      <img
                        src={formData.imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">{formData.image?.name}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 border-2 border-dashed border-zinc-700 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/30 transition-all flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <span className="text-sm text-zinc-400">Click to upload image</span>
                    <span className="text-[10px] text-zinc-600">PNG, JPG up to 2MB</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
