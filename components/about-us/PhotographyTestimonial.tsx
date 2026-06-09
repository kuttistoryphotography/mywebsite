'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Review {
  id: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  category: string;
  title: string;
  body: string;
  serviceDate?: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  wedding:      'Wedding',
  'pre-wedding':'Pre Wedding',
  outdoor:      'Outdoor',
  'baby-shoot': 'Baby Shoot',
  product:      'Product',
  corporate:    'Corporate',
  ads:          'Ads',
  'food-shoot': 'Food Shoot',
  other:        'Other',
};

// Fallback avatar initials
function Initials({ name }: { name: string }) {
  const init = name.split(' ').map((n) => n[0] || '').join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-white font-bold text-lg select-none">
      {init || '?'}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= rating ? 'text-red-500 fill-red-500' : 'text-zinc-700'}`}
        />
      ))}
      <span className="text-white font-bold ml-1.5 text-sm italic">{rating}.0</span>
    </div>
  );
}

export default function PhotographyTestimonial() {
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab,  setActiveTab]  = useState('all');
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [animating,  setAnimating]  = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch('/api/reviews');
        const data = await res.json();
        setReviews(data.reviews || []);
        // Build category list from returned categories + always include 'all' first
        const cats: string[] = Array.isArray(data.categories) ? data.categories : [];
        setCategories(cats);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = activeTab === 'all'
    ? reviews
    : reviews.filter((r) => r.category === activeTab);

  // Reset index when tab or reviews change
  useEffect(() => { setActiveIdx(0); }, [activeTab, reviews.length]);

  const switchTo = useCallback((idx: number) => {
    if (idx === activeIdx) return;
    setAnimating(true);
    setTimeout(() => { setActiveIdx(idx); setAnimating(false); }, 250);
  }, [activeIdx]);

  const prev = () => switchTo((activeIdx - 1 + filtered.length) % filtered.length);
  const next = () => switchTo((activeIdx + 1) % filtered.length);

  const current = filtered[activeIdx];

  // Tabs: 'all' + distinct categories
  const tabs = ['all', ...categories];

  return (
    <section className="bg-[#050505] text-white py-24 px-6 relative overflow-hidden">

      {/* ── HEADER ── */}
      <div className="text-center mb-14 space-y-4 relative z-10">
        <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          Our Stories
        </span>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight">Success stories</h2>
        <p className="text-neutral-500 max-w-2xl mx-auto text-lg font-light">
          Real clients share how we captured their vision and elevated their professional presence.
        </p>
      </div>

      {/* ── CATEGORY TABS ── */}
      {!loading && tabs.length > 1 && (
        <div className="flex justify-center flex-wrap gap-2 mb-12 relative z-10">
          {tabs.map((tab) => {
            const count = tab === 'all'
              ? reviews.length
              : reviews.filter((r) => r.category === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200',
                  isActive
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white/5 text-neutral-400 border-white/10 hover:border-red-600/50 hover:text-white',
                ].join(' ')}
              >
                {tab === 'all' ? 'All Reviews' : (CATEGORY_LABELS[tab] ?? tab)}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-neutral-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div className="flex justify-center py-20 relative z-10">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 relative z-10">
          <p className="text-zinc-500 text-lg">
            {reviews.length === 0
              ? 'No reviews yet — be the first to share your experience!'
              : `No ${activeTab === 'all' ? '' : (CATEGORY_LABELS[activeTab] ?? activeTab) + ' '}reviews yet.`}
          </p>
        </div>
      )}

      {/* ── AVATAR NAV ── */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="flex justify-center items-center gap-3 md:gap-5 mb-14 relative z-10 flex-wrap">
            {filtered.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => switchTo(idx)}
                className={[
                  'relative transition-all duration-400 rounded-full p-1',
                  activeIdx === idx
                    ? 'ring-2 ring-red-600 scale-125 z-20 shadow-[0_0_20px_rgba(220,38,38,0.4)] opacity-100'
                    : 'opacity-30 grayscale hover:opacity-80 hover:grayscale-0',
                ].join(' ')}
                title={r.userName}
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden">
                  {r.userAvatar
                    ? <img src={r.userAvatar} alt={r.userName} className="w-full h-full object-cover" />
                    : <Initials name={r.userName} />}
                </div>
              </button>
            ))}
          </div>

          {/* ── TESTIMONIAL CARD ── */}
          <div className={`max-w-5xl mx-auto relative z-10 transition-all duration-250 ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {current && (
              <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden">
                <div className="grid md:grid-cols-12 gap-12 items-start">

                  {/* LEFT: category + tags */}
                  <div className="md:col-span-4 space-y-6">
                    <div className="flex items-center gap-3 text-neutral-400 text-sm font-semibold tracking-wide uppercase">
                      <span className="text-red-600 text-xl font-black">✻</span> Service
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-lg text-[11px] font-bold text-red-400 uppercase tracking-wider">
                        {CATEGORY_LABELS[current.category] ?? current.category}
                      </span>
                    </div>
                    {current.serviceDate && (
                      <p className="text-zinc-600 text-xs">
                        {new Date(current.serviceDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>

                  {/* RIGHT: quote + author */}
                  <div className="md:col-span-8 space-y-8 md:border-l md:border-white/5 md:pl-12">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-white/10 shrink-0">
                        {current.userAvatar
                          ? <img src={current.userAvatar} className="w-full h-full object-cover" alt={current.userName} />
                          : <Initials name={current.userName} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-xl tracking-tight">{current.userName}</h4>
                        <p className="text-neutral-500 text-sm font-medium uppercase tracking-widest">
                          {CATEGORY_LABELS[current.category] ?? current.category} Client
                        </p>
                      </div>
                    </div>

                    <StarRow rating={current.rating} />

                    <p className="text-xl md:text-2xl text-neutral-200 leading-[1.5] font-light italic">
                      "{current.title}"
                    </p>
                    <p className="text-neutral-400 text-base leading-relaxed">
                      {current.body}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NAV CONTROLS */}
            {filtered.length > 1 && (
              <div className="flex justify-center gap-6 mt-12">
                <button onClick={prev} className="group p-5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-red-600/50 transition-all duration-300">
                  <ChevronLeft className="w-7 h-7 text-neutral-500 group-hover:text-white" />
                </button>
                <div className="flex items-center gap-2">
                  {filtered.map((_, i) => (
                    <button key={i} onClick={() => switchTo(i)}
                      className={`transition-all rounded-full ${i === activeIdx ? 'w-6 h-2 bg-red-600' : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'}`}
                    />
                  ))}
                </div>
                <button onClick={next} className="group p-5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-red-600/50 transition-all duration-300">
                  <ChevronRight className="w-7 h-7 text-neutral-500 group-hover:text-white" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* WATERMARK */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none opacity-[0.02] select-none">
        <h2 className="text-[25vw] font-black leading-none italic uppercase">Reviews</h2>
      </div>

      {/* ── STORY FLOW SECTION ── */}
      <div className="relative z-10 px-6 md:px-20 py-32">
        <div className="max-w-3xl mb-20">
          <h2 className="text-5xl md:text-7xl font-light leading-tight tracking-tight">
            Every story <span className="italic">unfolds</span><br />
            before it's captured
          </h2>
          <p className="text-zinc-400 mt-6 max-w-xl">
            Our process is quiet, intentional, and deeply human — allowing moments
            to breathe before they become memories.
          </p>
        </div>

        <div className="flex gap-12 overflow-x-auto pb-6 no-scrollbar">
          {[
            { step: '01', title: 'Observe',    desc: 'We arrive without interruption, letting emotions flow naturally.'      },
            { step: '02', title: 'Anticipate', desc: "Moments aren't forced — they're felt before they happen."              },
            { step: '03', title: 'Capture',    desc: 'Subtle glances, quiet laughs, fleeting touches.'                       },
            { step: '04', title: 'Curate',     desc: 'Each frame is refined to preserve its original emotion.'               },
            { step: '05', title: 'Deliver',    desc: 'A story that feels exactly the way it did.'                            },
          ].map((item) => (
            <div key={item.step} className="min-w-[280px] backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <span className="text-orange-500 text-sm tracking-widest">{item.step}</span>
              <h4 className="text-2xl font-medium mt-6 mb-3">{item.title}</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
