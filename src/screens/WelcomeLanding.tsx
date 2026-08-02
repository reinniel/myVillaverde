import React from 'react';
import { ArrowRight, Compass, MapPin, Sparkles, Users } from 'lucide-react';
import type { AppMode, Barangay } from '../types/app';
import { BarangayArtwork } from '../components/BarangayArtwork';

export interface LandingProps {
  activeBarangay: Barangay;
  onSelectMode: (mode: AppMode) => void;
}

export const WelcomeLanding: React.FC<LandingProps> = ({ activeBarangay, onSelectMode }) => (
  <main className="space-y-3 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3">
    <section className="rounded-[26px] border border-[#D5DED4] bg-[#FFFDF7]/90 px-5 py-4 text-center shadow-sm backdrop-blur-sm">
      <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#173E31] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-white">
        <MapPin className="h-3.5 w-3.5 text-[#F0C675]" />
        Villaverde, Nueva Vizcaya
      </span>
      <h1 className="mt-3 font-serif-header text-[25px] font-bold leading-[1.02] text-[#18241F]">
        One town, two ways to explore.
      </h1>
      <p className="mx-auto mt-2 max-w-[320px] text-xs font-medium leading-5 text-[#627066]">
        Choose a guide below. You can switch modes anytime.
      </p>
    </section>

    <section className="grid gap-3">
      <button
        type="button"
        onClick={() => onSelectMode('ko')}
        className="group relative min-h-[146px] overflow-hidden rounded-[28px] p-4 text-left text-white shadow-[0_10px_28px_rgba(43,106,78,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(43,106,78,0.24)] active:translate-y-0 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/25"
        style={{
          backgroundImage: `linear-gradient(135deg, ${activeBarangay.colors[0]} 0%, ${activeBarangay.colors[1]} 54%, ${activeBarangay.colors[2]} 100%)`,
        }}
      >
        <BarangayArtwork barangay={activeBarangay} compact />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
        <div className="relative z-10 flex min-h-[114px] flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] backdrop-blur-md">
              <Users className="h-3.5 w-3.5" />
              Local guide
            </span>
            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur-md">
              {activeBarangay.zipCode}
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-serif-header text-[28px] font-bold leading-none">VillaverdeKo</h2>
              <p className="mt-1.5 truncate text-[11px] font-semibold text-white/80">
                made for locals
              </p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#2B6A4E] shadow-lg transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-5 w-5" />
            </span>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelectMode('mo')}
        className="group relative min-h-[146px] overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#30443B_0%,#70566D_55%,#B96C50_100%)] p-4 text-left text-white shadow-[0_10px_28px_rgba(100,74,82,0.20)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(100,74,82,0.28)] active:translate-y-0 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#76527D]/25"
      >
        <svg aria-hidden="true" viewBox="0 0 400 160" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
          <circle cx="340" cy="24" r="58" fill="rgba(255,255,255,.10)" />
          <path d="M-20 128 C70 58 135 38 212 78 C286 116 337 84 430 24" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="28" strokeLinecap="round" />
          <path d="M-20 148 C88 82 148 72 230 104 C312 136 354 108 430 62" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/5" />
        <div className="relative z-10 flex min-h-[114px] flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] backdrop-blur-md">
              <Compass className="h-3.5 w-3.5" />
              Visitor guide
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-serif-header text-[28px] font-bold leading-none">VillaverdeMo</h2>
              <p className="mt-1.5 truncate text-[11px] font-semibold text-white/80">
                Sights, food, routes, and local finds
              </p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#76527D] shadow-lg transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-5 w-5" />
            </span>
          </div>
        </div>
      </button>
    </section>
  </main>
);
