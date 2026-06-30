"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import MediaField from "@/components/ui/MediaField";

export default function BookingSettingsSection() {
  const [bookingImage, setBookingImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/booking-settings")
      .then((res) => res.json())
      .then((data) => {
        setBookingImage(data.bookingImage || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);

    await fetch("/api/booking-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingImage,
      }),
    });

    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">
          Booking Page Settings
        </h2>

        {saved && (
          <span className="text-green-400 text-sm">
            ✓ Saved Successfully
          </span>
        )}
      </div>

      <MediaField
        label="Booking Left Image"
        url={bookingImage}
        mediaType="image"
        onChange={(url) => setBookingImage(url)}
        allowedTypes={["image"]}
        context="homepage"
      />

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl font-semibold text-black"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}

        Save Booking Image
      </button>
    </div>
  );
}