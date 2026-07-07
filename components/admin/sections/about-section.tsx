"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import MediaField from "@/components/ui/MediaField";

interface HeroData {
  heading: string; subheading: string; paragraph: string; highlightWord: string;
  images: string[]; profileImage: string; profileName: string; profileRole: string;
}
interface StoryData {
  heading: string;
  paragraph: string;
  image: string;
  rightImage: string;
  videoUrl: string;
}
interface TeamMember { name: string; role: string; image: string }
interface TimelineEntry { id: string; year: string; title: string; text: string; image: string }

const TABS = [
  { id: "hero",     label: "Hero" },
  { id: "story",    label: "Story" },
  { id: "team",     label: "Team" },
  { id: "timeline", label: "Timeline" },
] as const;
type TabId = typeof TABS[number]["id"];

export default function AboutSection() {
  const [activeTab, setActiveTab] = useState<TabId>("hero");
  const [hero,  setHero]  = useState<HeroData>({ heading: "", subheading: "", paragraph: "", highlightWord: "", images: ["","","",""], profileImage: "", profileName: "", profileRole: "" });
  const [story, setStory] = useState<StoryData>({
    heading: "",
    paragraph: "",
    image: "",
    rightImage: "",
    videoUrl: "",
  });
  const [team,  setTeam]  = useState<TeamMember[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    fetch("/api/about").then((r) => r.json()).then((data) => {
      if (data.settings?.hero) {
        const h = data.settings.hero;
        setHero({ heading: h.heading || "", subheading: h.subheading || "", paragraph: h.paragraph || "", highlightWord: h.highlightWord || "", profileName: h.profileName || "", profileRole: h.profileRole || "", profileImage: h.profileImage || "", images: Array.isArray(h.images) ? [...h.images, "","","",""].slice(0, 4) : ["","","",""] });
      }
      if (data.settings?.story)    setStory(data.settings.story);
      if (Array.isArray(data.settings?.team))     setTeam(data.settings.team);
      if (Array.isArray(data.settings?.timeline)) setTimeline(data.settings.timeline);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async (section: string, data: unknown) => {
    setSaving(true);
    try {
      await fetch("/api/about", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, data }) });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const setHeroImage = (idx: number, url: string) => {
    const imgs = [...hero.images]; imgs[idx] = url; setHero({ ...hero, images: imgs });
  };

  // ── Team helpers ──
  const addMember  = () => setTeam([...team, { name: "", role: "", image: "" }]);
  const removeMember = (i: number) => setTeam(team.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof TeamMember, val: string) => {
    const t = [...team]; t[i] = { ...t[i], [field]: val }; setTeam(t);
  };

  // ── Timeline helpers ──
  const addEntry    = () => setTimeline([...timeline, { id: `entry-${Date.now()}`, year: "", title: "", text: "", image: "" }]);
  const removeEntry = (i: number) => setTimeline(timeline.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: keyof TimelineEntry, val: string) => {
    const t = [...timeline]; t[i] = { ...t[i], [field]: val }; setTimeline(t);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>;

  const SaveBtn = ({ section, data }: { section: string; data: unknown }) => (
    <button onClick={() => save(section, data)} disabled={saving}
      className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">About Us</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage all content shown on the About Us page.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === t.id ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── HERO ── */}
      {activeTab === "hero" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
          <h3 className="text-white font-semibold text-lg">Hero Section</h3>
          <p className="text-zinc-500 text-sm">Controls the main About Us hero layout — large text, gallery grid, and profile card.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              { key: "heading",       label: "Main Heading",      ph: "Capturing the Silent Stories…" },
              { key: "highlightWord", label: "Highlight Word/Phrase (muted colour)", ph: "Silent Stories" },
              { key: "profileName",   label: "Profile Name",      ph: "Leslie Alexander" },
              { key: "profileRole",   label: "Profile Role",      ph: "Lead Photographer" },
            ] as const).map(({ key, label, ph }) => (
              <div key={key}>
                <label className="block text-zinc-400 text-sm mb-1.5">{label}</label>
                <input value={(hero as any)[key]} placeholder={ph}
                  onChange={(e) => setHero({ ...hero, [key]: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-zinc-400 text-sm mb-1.5">Subheading</label>
              <textarea value={hero.subheading} rows={2} placeholder="We specialize in outdoor night shoots…"
                onChange={(e) => setHero({ ...hero, subheading: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-zinc-400 text-sm mb-1.5">Body Paragraph</label>
              <textarea value={hero.paragraph} rows={3} placeholder="Bringing out the soul of every moment…"
                onChange={(e) => setHero({ ...hero, paragraph: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
            </div>
          </div>
          <MediaField label="Profile Photo" url={hero.profileImage} onChange={(url) => setHero({ ...hero, profileImage: url })} mediaType="image" context="about" />
          <div>
            <p className="text-zinc-300 text-sm font-semibold mb-3">Gallery Grid (4 images)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((idx) => (
                <MediaField key={idx} label={`Gallery Image ${idx + 1}`} url={hero.images[idx] || ""} onChange={(url) => setHeroImage(idx, url)} mediaType="image" context="about" />
              ))}
            </div>
          </div>
          <SaveBtn section="hero" data={hero} />
        </div>
      )}

      {/* ── STORY ── */}
      {activeTab === "story" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
          <h3 className="text-white font-semibold text-lg">Story / Case Study Section</h3>
          <p className="text-zinc-500 text-sm">Controls the "Behind the Lens" card with a circular image and story text.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1.5">Section Heading</label>
              <input value={story.heading} placeholder="Behind the Lens"
                onChange={(e) => setStory({ ...story, heading: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-zinc-400 text-sm mb-1.5">Paragraph</label>
              <textarea value={story.paragraph} rows={3} placeholder="Our night sessions showcase natural light…"
                onChange={(e) => setStory({ ...story, paragraph: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
            </div>
          </div>
          <MediaField label="Right Card Image" url={story.rightImage} onChange={(url) =>setStory({  ...story,   rightImage: url,  }) } mediaType="image" context="about" />
          <MediaField label="Story Video (plays on hover)" url={story.videoUrl} onChange={(url) => setStory({ ...story, videoUrl: url })} mediaType="video" context="about" />
          <SaveBtn section="story" data={story} />
        </div>
      )}

      {/* ── TEAM ── */}
      {activeTab === "team" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg">Team Members</h3>
              <p className="text-zinc-500 text-sm mt-0.5">Manage the team cards shown in the Team section.</p>
            </div>
            <button onClick={addMember} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Member
            </button>
          </div>

          <div className="space-y-4">
            {team.map((member, i) => (
              <div key={i} className="bg-zinc-800 rounded-xl p-4 space-y-4 border border-zinc-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-sm font-semibold text-zinc-300">{member.name || `Member ${i + 1}`}</span>
                  </div>
                  <button onClick={() => removeMember(i)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1.5">Name</label>
                    <input value={member.name} placeholder="Full Name"
                      onChange={(e) => updateMember(i, "name", e.target.value)}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1.5">Role</label>
                    <input value={member.role} placeholder="e.g. Lead Photographer"
                      onChange={(e) => updateMember(i, "role", e.target.value)}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                  </div>
                </div>
                <MediaField label="Photo" url={member.image} onChange={(url) => updateMember(i, "image", url)} mediaType="image" context="about" />
              </div>
            ))}
            {team.length === 0 && (
              <p className="text-zinc-600 text-sm text-center py-8 border border-dashed border-zinc-700 rounded-xl">
                No team members yet. Click "Add Member" to get started.
              </p>
            )}
          </div>
          <SaveBtn section="team" data={team} />
        </div>
      )}

      {/* ── TIMELINE ── */}
      {activeTab === "timeline" && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg">Timeline / Legacy</h3>
              <p className="text-zinc-500 text-sm mt-0.5">Manage the scrolling timeline entries on the About Us page.</p>
            </div>
            <button onClick={addEntry} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>

          <div className="space-y-4">
            {timeline.map((entry, i) => (
              <div key={i} className="bg-zinc-800 rounded-xl p-4 space-y-4 border border-zinc-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-300">{entry.year ? `${entry.year} — ` : ''}{entry.title || `Entry ${i + 1}`}</span>
                  </div>
                  <button onClick={() => removeEntry(i)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1.5">Year</label>
                    <input value={entry.year} placeholder="2025"
                      onChange={(e) => updateEntry(i, "year", e.target.value)}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1.5">Title</label>
                    <input value={entry.title} placeholder="e.g. The Modern Era"
                      onChange={(e) => updateEntry(i, "title", e.target.value)}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1.5">Anchor ID (unique, no spaces)</label>
                    <input value={entry.id} placeholder="e.g. vision"
                      onChange={(e) => updateEntry(i, "id", e.target.value.replace(/\s+/g, '-').toLowerCase())}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none font-mono" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 text-xs mb-1.5">Description</label>
                    <textarea value={entry.text} rows={2} placeholder="What happened this year…"
                      onChange={(e) => updateEntry(i, "text", e.target.value)}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
                  </div>
                </div>
                <MediaField label="Background Image" url={entry.image} onChange={(url) => updateEntry(i, "image", url)} mediaType="image" context="about" />
              </div>
            ))}
            {timeline.length === 0 && (
              <p className="text-zinc-600 text-sm text-center py-8 border border-dashed border-zinc-700 rounded-xl">
                No timeline entries yet. Click "Add Entry" to get started.
              </p>
            )}
          </div>
          <SaveBtn section="timeline" data={timeline} />
        </div>
      )}
    </div>
  );
}