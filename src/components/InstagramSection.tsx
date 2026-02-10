"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Instagram, ChevronLeft, ChevronRight } from "lucide-react";

const ALAMICOS_INSTAGRAM = "https://www.instagram.com/alamicos_fc/";

const INSTAGRAM_POSTS = [
  "https://www.instagram.com/p/DAtx59UySWB/",
  "https://www.instagram.com/p/DNjXMcqORDT/",
  "https://www.instagram.com/p/C_-6l_AJjdu/",
  "https://www.instagram.com/p/CnUmHBHukHc/",
  "https://www.instagram.com/p/CbJkbrKt8Du/",
  "https://www.instagram.com/p/Cm2j3etJVXn/",
  "https://www.instagram.com/p/BqYWm0nB10s/",
];

function getEmbedUrl(postUrl: string): string {
  const match = postUrl.match(/instagram\.com\/p\/([^/]+)/);
  const code = match ? match[1] : "";
  return `https://www.instagram.com/p/${code}/embed`;
}

export default function InstagramSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollTo = (index: number) => {
    const i = Math.max(0, Math.min(index, INSTAGRAM_POSTS.length - 1));
    setCurrentIndex(i);
    scrollRef.current?.querySelector(`[data-slide="${i}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.offsetWidth * 0.85;
    const i = Math.round(scrollLeft / (cardWidth + 16));
    setCurrentIndex(Math.min(i, INSTAGRAM_POSTS.length - 1));
  }, []);

  return (
    <section
      id="instagram"
      className="relative py-20 px-4 overflow-hidden stripes-football"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-sky-950/95 via-red-950/25 to-pitch-green/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-red-500/5" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <a
            href={ALAMICOS_INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 font-display text-2xl sm:text-3xl text-white hover:text-pink-300 transition-colors"
          >
            <Instagram className="w-8 h-8 text-pink-400" />
            <span>@alamicos_fc</span>
          </a>
          <p className="text-white/60 font-body text-sm mt-2">
            Síguenos en Instagram
          </p>
        </motion.div>

        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 scrollbar-thin"
            style={{
              scrollbarWidth: "thin",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {INSTAGRAM_POSTS.map((url, i) => (
              <div
                key={url}
                data-slide={i}
                className="flex-shrink-0 w-[min(90vw,380px)] sm:w-[420px] snap-center"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden border-2 border-white/20 hover:border-pink-400/50 transition-colors bg-black/40"
                >
                  <iframe
                    src={getEmbedUrl(url)}
                    title={`Instagram post ${i + 1}`}
                    className="w-full h-[480px] sm:h-[520px]"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </a>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => scrollTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-white/10 border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="font-mono text-sm text-white/70">
              {currentIndex + 1} / {INSTAGRAM_POSTS.length}
            </span>
            <button
              type="button"
              onClick={() => scrollTo(currentIndex + 1)}
              disabled={currentIndex === INSTAGRAM_POSTS.length - 1}
              className="p-2 rounded-full bg-white/10 border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
