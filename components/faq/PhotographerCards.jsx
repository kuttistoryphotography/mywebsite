"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  Search,
  HelpCircle,
  PhoneCall,
  MessageSquare,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";

const cardData = [
  {
    title: "kuttiStory ai",
    description:
      "Ask kuttistory ai and get your questions answered, instantly.",
    icon: <MessageSquare size={20} />,
    type: "input",
    bgColor: "bg-[#F5F5F5]",
    textColor: "text-black",
  },
  {
    title: "FAQs",
    description: "Your most commonly asked questions, answered.",
    icon: <HelpCircle size={20} />,
    type: "button",
    label: "View all FAQs",
    link: "/faq",
    bgColor: "bg-zinc-900",
    textColor: "text-white",
  },
  {
    title: "Contact Us",
    description:
      "Get in touch with a member of our team for direct assistance.",
    icon: <PhoneCall size={20} />,
    type: "button",
    label: "Get in touch",
    link: "/contact-us",
    bgColor: "bg-zinc-900",
    textColor: "text-white",
  },
];


export default function PhotographerCards() {
  const sectionRef = useRef(null);
  const [whatsappMsg, setWhatsappMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".faq-card", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power4.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleWhatsAppRedirect = () => {
    if (!whatsappMsg.trim()) return;

    const phoneNumber = "919342013600";
    const encodedMsg = encodeURIComponent(whatsappMsg);

    window.open(
      `https://wa.me/${phoneNumber}?text=${encodedMsg}`,
      "_blank"
    );
  };

  const handleHover = (e, isEnter) => {
    gsap.to(e.currentTarget, {
      y: isEnter ? -10 : 0,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleCardAction = (card) => {
    if (card.link) {
      router.push(card.link);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="w-full bg-black text-white px-6 py-20"
    >
      <div className="w-full max-w-[1400px] mx-auto">

        {/* Header Area */}
        <div className="flex justify-between items-start mb-20">
          <h1 className="text-5xl md:text-7xl font-medium tracking-tight leading-none max-w-xl">
            Have a question ? <br /> ask with us...
          </h1>

          <div className="hidden md:flex flex-col items-center gap-2">
            <div className="w-5 h-8 border-2 border-zinc-500 rounded-full flex justify-center p-1">
              <div className="w-1 h-2 bg-zinc-500 rounded-full animate-bounce" />
            </div>

            <span className="text-xs text-zinc-500 font-medium">
              Scroll down
            </span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cardData.map((card, index) => (
            <div
              key={index}
              onMouseEnter={(e) => handleHover(e, true)}
              onMouseLeave={(e) => handleHover(e, false)}
              className={`faq-card ${card.bgColor} ${card.textColor} p-10 rounded-[2.5rem] flex flex-col h-[400px] justify-between transition-colors duration-300`}
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-8 ${
                    card.textColor === "text-black"
                      ? "bg-black text-white"
                      : "bg-zinc-800 text-white"
                  }`}
                >
                  {card.icon}
                </div>

                <h3 className="text-4xl font-semibold mb-4 tracking-tight">
                  {card.title}
                </h3>

                <p
                  className={`text-lg leading-relaxed ${
                    card.textColor === "text-black"
                      ? "text-black/70"
                      : "text-zinc-400"
                  }`}
                >
                  {card.description}
                </p>
              </div>

              <div className="mt-8">
                {card.type === "input" ? (
                  <div className="relative flex items-center">
                    <Search
                      className="absolute left-4 text-black/50"
                      size={18}
                    />

                    <input
                      type="text"
                      value={whatsappMsg}
                      onChange={(e) => setWhatsappMsg(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleWhatsAppRedirect()
                      }
                      placeholder="Type your question here"
                      className="w-full bg-black/5 border border-black/10 rounded-full py-4 pl-12 pr-14 placeholder:text-black/40 focus:outline-none focus:border-black transition-all"
                    />

                    <button
                      type="button"
                      onClick={handleWhatsAppRedirect}
                      className="absolute right-2 bg-black text-white p-2.5 rounded-full hover:scale-110 transition-transform active:scale-95"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCardAction(card)}
                    className="bg-zinc-950 text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-white hover:text-black transition-all duration-300"
                  >
                    {card.label}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}