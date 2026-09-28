"use client";

import { useState } from "react";
import { Clipboard, Check, Loader2 } from "lucide-react";

interface PasteButtonProps {
  onPaste: (text: string) => void;
}

export default function PasteButton({ onPaste }: PasteButtonProps) {
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState(false);

  const handlePaste = async () => {
    try {
      setPasting(true);

      const text = await navigator.clipboard.readText();

      if (!text) {
        return;
      }

      onPaste(text);

      setPasted(true);

      setTimeout(() => {
        setPasted(false);
      }, 1200);
    } catch (error) {
      console.error("Clipboard paste failed:", error);
      alert("Please allow clipboard access in your browser.");
    } finally {
      setPasting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePaste}
      disabled={pasting}
      title="Paste from clipboard"
      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-colors text-xs disabled:opacity-50"
    >
      {pasting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : pasted ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Clipboard className="w-3.5 h-3.5" />
      )}

      {pasted ? "Pasted" : "Paste"}
    </button>
  );
}