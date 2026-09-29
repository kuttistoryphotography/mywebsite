"use client";

import { useEffect, useState } from "react";

interface MemoriesAccessButtonProps {
  driveUrl: string;
}

export default function MemoriesAccessButton({
  driveUrl,
}: MemoriesAccessButtonProps) {
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setUnlocked(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  if (unlocked) {
    return (
      <a
        href={driveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3.5 px-5 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors text-center"
      >
        🔓 View Your Memories
      </a>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled
        className="w-full py-3.5 px-5 rounded-xl bg-zinc-800 text-zinc-500 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span>🔒</span>

        <span>View Your Memories</span>

        <span>({secondsLeft}s)</span>
      </button>

      <p className="text-xs text-zinc-500 mt-2 text-center">
        Your memories will unlock in {secondsLeft} seconds.
        </p>

        <div className="mt-5 text-left rounded-xl bg-zinc-800/50 border border-zinc-700/70 p-4">
        <p className="text-sm font-semibold text-white mb-3">
            While Your Memories Prepare
        </p>

        <div className="space-y-3 text-xs text-zinc-400 leading-5">
            <p>
            <strong className="text-zinc-200">
                1. While You Wait —
            </strong>{" "}
            Please leave us a genuine Google review to unlock
            your memories page.
            </p>

            <p>
            <strong className="text-zinc-200">
                2. Don&apos;t Refresh the Page —
            </strong>{" "}
            Refreshing may restart the countdown.
            </p>

            <p>
            <strong className="text-zinc-200">
                3. Check Your Review —
            </strong>{" "}
            If you haven&apos;t already, tap{" "}
            <strong className="text-zinc-200">
                “Leave a Google Review”
            </strong>{" "}
            and share your honest experience.
            </p>

            <p>
            <strong className="text-zinc-200">
                4. Get Ready for Your Memories ✨ —
            </strong>{" "}
            Your private memories will be available shortly.
            Thank you for choosing Kutti Story Photography!
            </p>
        </div>
        </div>
    </div>
  );
}