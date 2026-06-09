"use client";

import { useState } from "react";
import { X, MessageSquare, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  quoteNumber: string;
  quoteTitle: string;
}

export default function RequoteDialog({
  isOpen,
  onClose,
  onSubmit,
  quoteNumber,
  quoteTitle,
}: RequoteDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError("Please provide a reason for requesting a requote");
      return;
    }

    if (reason.trim().length < 10) {
      setError("Please provide more details (at least 10 characters)");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(reason.trim());
      setReason("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit requote request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              Request Requote
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {quoteNumber} - {quoteTitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-zinc-300 mb-2">
              Why do you want to requote this order?
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="Please explain what changes you'd like or why you need a revised quote..."
              disabled={isSubmitting}
              className={cn(
                "w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder:text-zinc-500",
                "focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500",
                "disabled:opacity-50 disabled:cursor-not-allowed resize-none",
                error ? "border-red-500" : "border-zinc-700"
              )}
              rows={6}
            />
            <p className="text-xs text-zinc-500 mt-2">
              {reason.length}/500 characters (minimum 10 characters)
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-300">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1 text-amber-300/80">
                  <li>• Your request will be sent to our team</li>
                  <li>• We'll review your requirements</li>
                  <li>• You'll receive a revised quote within 24-48 hours</li>
                  <li>• Your original quote will remain valid until then</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim() || reason.trim().length < 10}
              className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Requote Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
