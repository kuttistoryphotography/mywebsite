"use client";

import { Plus, Trash2, Clipboard, Check, Loader2 } from "lucide-react";
import { useState } from "react";

export interface GalleryStory {
  label: string;
  title: string;
  text: string;
}

interface GalleryStoryEditorProps {
  stories: GalleryStory[];
  onChange: (stories: GalleryStory[]) => void;
}

function PasteButton({ onPaste }: { onPaste: (text: string) => void }) {
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState(false);

  const handlePaste = async () => {
    try {
      setPasting(true);

      const text = await navigator.clipboard.readText();

      if (!text) return;

      onPaste(text);
      setPasted(true);

      window.setTimeout(() => {
        setPasted(false);
      }, 1200);
    } catch (error) {
      console.error("Clipboard paste failed:", error);
      alert("Please allow clipboard access in your browser to use Paste.");
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
      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-colors text-xs disabled:opacity-50"
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

export default function GalleryStoryEditor({
  stories,
  onChange,
}: GalleryStoryEditorProps) {
  const addStory = () => {
    onChange([
      ...stories,
      {
        label: "",
        title: "",
        text: "",
      },
    ]);
  };

  const updateStory = (
    index: number,
    field: keyof GalleryStory,
    value: string
  ) => {
    const updatedStories = [...stories];

    updatedStories[index] = {
      ...updatedStories[index],
      [field]: value,
    };

    onChange(updatedStories);
  };

  const deleteStory = (index: number) => {
    onChange(stories.filter((_, storyIndex) => storyIndex !== index));
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Gallery Story Text
          </h3>

          <p className="text-sm text-zinc-500 mt-1">
            Add custom story text between your gallery images.
          </p>
        </div>

        <button
          type="button"
          onClick={addStory}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Add Story
        </button>
      </div>

      <div className="space-y-6">
        {stories.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">
            No gallery stories added yet.
          </div>
        )}

        {stories.map((story, index) => (
          <div
            key={index}
            className="rounded-xl border border-white/10 bg-zinc-900/50 p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-medium text-white">
                Story {index + 1}
              </h4>

              <button
                type="button"
                onClick={() => deleteStory(index)}
                className="text-red-400 hover:text-red-300 transition"
                title="Delete Story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Label
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={story.label}
                    onChange={(e) =>
                      updateStory(index, "label", e.target.value)
                    }
                    placeholder="Example: A Moment to Remember"
                    className="w-full rounded-lg bg-zinc-950 border border-white/10 px-4 pr-24 py-3 text-white outline-none focus:border-orange-500"
                  />

                  <PasteButton
                    onPaste={(text) =>
                      updateStory(index, "label", text)
                    }
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Story Title
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={story.title}
                    onChange={(e) =>
                      updateStory(index, "title", e.target.value)
                    }
                    placeholder="Your gallery story heading"
                    className="w-full rounded-lg bg-zinc-950 border border-white/10 px-4 pr-24 py-3 text-white outline-none focus:border-orange-500"
                  />

                  <PasteButton
                    onPaste={(text) =>
                      updateStory(index, "title", text)
                    }
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Story Description
                </label>

                <div className="relative">
                  <textarea
                    value={story.text}
                    onChange={(e) =>
                      updateStory(index, "text", e.target.value)
                    }
                    placeholder="Write the story description..."
                    rows={4}
                    className="w-full rounded-lg bg-zinc-950 border border-white/10 px-4 py-3 pr-24 text-white outline-none focus:border-orange-500 resize-none"
                  />

                  <PasteButton
                    onPaste={(text) =>
                      updateStory(index, "text", text)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
