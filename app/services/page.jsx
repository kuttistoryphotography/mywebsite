"use client";

import ServicesGropu from "../../components/services/servicegropu";

export default function ServicesPage() {
  return (
    <>
      {/* Services Content */}
      <ServicesGropu />

      {/* SEO Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-white/10">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          {/* Left Side */}
          <div>
            <span className="text-orange-500 uppercase tracking-[0.35em] text-sm font-medium">
              Our Services
            </span>

            <h2 className="text-5xl lg:text-6xl font-bold mt-6 leading-tight">
              Professional
              <br />
              Photography &
              <br />
              Videography
            </h2>

            <p className="mt-8 text-gray-400 text-lg leading-8">
              Capturing life's most memorable moments with premium photography,
              cinematic videography, creative storytelling, and professional
              editing across Madurai and Tamil Nadu.
            </p>

            <a
              href="/contact"
              className="inline-flex items-center gap-3 mt-10 bg-[#ff6b00] hover:bg-orange-600 transition-all duration-300 px-8 py-4 rounded-full text-white font-semibold"
            >
              Book Your Session
              <span>→</span>
            </a>
          </div>

          {/* Right Side */}
          <div className="space-y-8 text-lg text-gray-400 leading-9">
            <p>
              Kutti Story Photography offers professional photography and
              videography services throughout Madurai and Tamil Nadu. Our
              experienced team specializes in candid wedding photography,
              traditional wedding photography, cinematic wedding films,
              pre-wedding photography, engagement photography, maternity
              photography, baby shower photography, newborn and baby
              photoshoots, birthday celebrations, family portraits, school
              events, corporate events, product photography, promotional video
              production.
            </p>

            <p>
              Every celebration tells a unique story. We combine creativity,
              natural emotions, cinematic composition, premium color grading,
              drone coverage, and high-end editing techniques to deliver
              timeless photographs and films that families will cherish
              forever.
            </p>

            <p>
              Whether you need complete wedding coverage, event photography,
              commercial photography, or social media content creation, our
              customized packages are designed to match every requirement and
              budget while maintaining exceptional quality and service.
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mt-24 pt-16 border-t border-white/10">
          <div>
            <h3 className="text-5xl font-bold text-white">150+</h3>
            <p className="text-gray-500 mt-3 uppercase tracking-widest text-sm">
              Weddings Covered
            </p>
          </div>

          <div>
            <h3 className="text-5xl font-bold text-white">1000+</h3>
            <p className="text-gray-500 mt-3 uppercase tracking-widest text-sm">
              Happy Clients
            </p>
          </div>

          <div>
            <h3 className="text-5xl font-bold text-white">20+</h3>
            <p className="text-gray-500 mt-3 uppercase tracking-widest text-sm">
              Photography Services
            </p>
          </div>

          <div>
            <h3 className="text-5xl font-bold text-white">7+</h3>
            <p className="text-gray-500 mt-3 uppercase tracking-widest text-sm">
              Years Experience
            </p>
          </div>
        </div>
      </section>
    </>
  );
}