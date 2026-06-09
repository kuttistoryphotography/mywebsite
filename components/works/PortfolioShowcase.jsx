"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const TABS = ["All", "Wedding", "Pre Wedding", "Outdoor", "Baby Shoot", "Product", "Corporate", "Ads"];

export default function PortfolioShowcase() {
  const [activeTab, setActiveTab] = useState("All");
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch portfolio items from API on mount
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch("/api/portfolio");
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
          setPortfolioItems([]);
        } else if (data.items && Array.isArray(data.items)) {
          setPortfolioItems(data.items);
        } else {
          setPortfolioItems([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load portfolio");
        setPortfolioItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolio();
  }, []);

  // Filter items by category
  const filteredItems = activeTab === "All" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeTab);

  return (
    <section className="bg-black text-white px-6 md:px-12 py-24 min-h-screen">
      {/* Header */}
      <div className="mb-16 text-center">
        <p className="text-orange-500 text-xs font-bold tracking-[0.3em] uppercase mb-4">
          Visual Journey
        </p>
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Stories told through frames
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-20">
        <div className="flex flex-wrap justify-center items-center bg-zinc-900/50 p-2 rounded-full border border-zinc-800 backdrop-blur-md">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 uppercase tracking-widest ${
                activeTab === tab
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 text-lg mb-2">Error loading portfolio</p>
            <p className="text-zinc-500 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-orange-500 text-black rounded-lg hover:bg-orange-400 transition"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">No portfolio items available in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/portfolio/${item.slug || item.id}`)}
                className="relative group cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 h-[400px]"
              >
                {/* Image */}
                {item.cover_image ? (
                  <img
                    src={item.cover_image || "/placeholder.svg"}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                    <span className="text-zinc-600 text-6xl font-bold">{item.title?.charAt(0) || "?"}</span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

                {/* Featured Badge */}
                {item.featured && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-orange-500 text-black text-xs font-bold uppercase tracking-wider rounded-full">
                    Featured
                  </div>
                )}

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <p className="text-orange-400 text-xs font-bold tracking-widest uppercase mb-2">
                    {item.category}{item.location ? ` · ${item.location}` : ""}
                  </p>
                  <h3 className="text-2xl font-bold mb-1">{item.title}</h3>
                  {item.client_name && (
                    <p className="text-zinc-400 text-sm">{item.client_name}</p>
                  )}
                  <div className="h-1 w-0 group-hover:w-16 bg-orange-500 transition-all duration-500 mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
