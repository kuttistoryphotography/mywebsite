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
    </div>
  );
}