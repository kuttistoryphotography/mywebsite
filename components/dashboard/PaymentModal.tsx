"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, AlertCircle } from "lucide-react";
import QRCode from "qrcode";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  amount: number;
  bookingNumber: string;
  onPaymentSuccess?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  bookingId,
  amount,
  bookingNumber,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [upiId] = useState("anantheditz1616-2@okaxis");
  const [accountName] = useState("Kutti Story Photography");

  const paymentAmount = isPartialPayment && customAmount ? parseFloat(customAmount) : amount;

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, paymentAmount]);

  useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return () => {
    document.body.style.overflow = "auto";
  };
}, [isOpen]);

  const generateQRCode = async () => {
    try {
      // UPI payment string format
      const upiString = `upi://pay?pa=${upiId}&pn=${accountName}&am=${paymentAmount}&cu=INR&tn=Payment for Booking ${bookingNumber}`;
      const qrUrl = await QRCode.toDataURL(upiString, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!utrNumber.trim()) {
      alert("Please enter the UTR/Transaction Reference number");
      return;
    }

    if (utrNumber.length < 6) {
      alert("Please enter a valid UTR number (minimum 6 characters)");
      return;
    }

    if (isPartialPayment) {
      const amountValue = parseFloat(customAmount);
      if (!customAmount || isNaN(amountValue) || amountValue <= 0) {
        alert("Please enter a valid payment amount");
        return;
      }
      if (amountValue > amount) {
        alert(`Payment amount cannot exceed pending amount of ₹${amount.toLocaleString("en-IN")}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount: paymentAmount,
          transactionId: utrNumber.trim(),
          paymentMethod: "upi",
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Payment submitted successfully!");
        setUtrNumber("");
        setNotes("");
        onClose();
        // Trigger callback to refresh payment data
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        alert(data.error || "Failed to submit payment");
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      alert("Error submitting payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-[180px] max-h-[70vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Make Payment</h2>
            <p className="text-sm text-zinc-500">Booking #{bookingNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-4">
          {/* Amount */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-sm text-zinc-400 mb-2 text-center">Pending Amount</p>
            <p className="text-xl font-bold text-amber-400 text-center">
              ₹{amount.toLocaleString("en-IN")}
            </p>
            
            {/* Partial Payment Checkbox */}
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPartialPayment}
                  onChange={(e) => {
                    setIsPartialPayment(e.target.checked);
                    if (!e.target.checked) {
                      setCustomAmount("");
                    }
                  }}
                  className="w-4 h-4 rounded border-zinc-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
                />
                <span className="text-sm text-zinc-300 font-medium">Make Partial Payment</span>
              </label>

              {/* Custom Amount Input */}
              {isPartialPayment && (
                <div className="mt-3">
                  <label className="text-xs text-zinc-500 block mb-1">Enter Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min="1"
                      max={amount}
                      className="w-full pl-8 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Maximum: ₹{amount.toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              {/* Payment Amount Display */}
              {(isPartialPayment && customAmount) && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-xs text-emerald-400 mb-1">You will pay</p>
                  <p className="text-xl font-bold text-emerald-400">
                    ₹{parseFloat(customAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl p-4 flex items-center justify-center">
            {qrCodeUrl ? (
              <img
              src={qrCodeUrl}
              alt="Payment QR Code"
              className="w-full max-w-[220px] h-auto object-contain"
            />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* UPI ID */}
          <div>
            <p className="text-sm text-zinc-400 mb-2">UPI ID</p>
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 min-w-0 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3">
                <p className="font-mono font-medium text-white break-all text-sm">
                  {upiId}
                </p>
              </div>
              <button
                onClick={handleCopyUPI}
                className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 hover:bg-amber-500/20 transition-colors"
                title="Copy UPI ID"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm text-blue-400">
                <p className="font-medium">Payment Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Scan the QR code or use the UPI ID</li>
                  <li>Complete the payment in your UPI app</li>
                  <li>Copy the UTR/Transaction Reference number</li>
                  <li>Enter it below and submit</li>
                </ol>
              </div>
            </div>
          </div>

          {/* UTR Input */}
          <div>
            <label className="text-sm font-medium text-zinc-400 block mb-2">
              UTR / Transaction Reference Number *
            </label>
            <input
              type="text"
              placeholder="Enter UTR number (e.g., 123456789012)"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              disabled={isSubmitting}
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="text-sm font-medium text-zinc-400 block mb-2">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Add any notes about this payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !utrNumber.trim()}
            className="w-full py-3 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
