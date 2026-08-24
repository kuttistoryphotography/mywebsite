"use client";

import { Plus, Trash2 } from "lucide-react";

export interface GalleryStory {
  label: string;
  title: string;
  text: string;
}

interface GalleryStoryEditorProps {
  stories: GalleryStory[];
  onChange: (stories: GalleryStory[]) => void;
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

                <input
                  type="text"
                  value={story.label}
                  onChange={(e) =>
                    updateStory(index, "label", e.target.value)
                  }
                  placeholder="Example: A Moment to Remember"
                  className="w-full rounded-lg bg-zinc-950 border border-white/10 px-4 py-3 text-white outline-none focus:border-orange-500"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Story Title
                </label>

                <input
                  type="text"
                  value={story.title}
                  onChange={(e) =>
                    updateStory(index, "title", e.target.value)
                  }
                  placeholder="Your gallery story heading"
                  className="w-full rounded-lg bg-zinc-950 border border-white/10 px-4 py-3 text-white outline-none focus:border-orange-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Story Description
                </label>

                <textarea
                  value={story.text}
                  onChange={(e) =>
                    updateStory(index, "text", e.target.value)
                  }
                  placeholder="Write the story description..."
                  rows={4}
                  className="w-full rounded-lg bg-zinc-950 border border-white/10 px-4 py-3 text-white outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}