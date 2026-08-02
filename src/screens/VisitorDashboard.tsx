import React from 'react';
import { Compass, Heart, LocateFixed, Sparkles } from 'lucide-react';
import type { GuideCategory, ModalId } from '../types/app';
import { VISITOR_CATEGORIES } from '../data/categories';
import { CategoryList } from '../components/CategoryList';

export interface VisitorDashboardProps {
  onOpenMap: () => void;
  onOpenModal: (modal: Exclude<ModalId, null>) => void;
  onOpenCategory: (category: GuideCategory) => void;
}

export const VisitorDashboard: React.FC<VisitorDashboardProps> = ({ onOpenMap, onOpenModal, onOpenCategory }) => {
  const handleVisitorCategory = (category: GuideCategory) => {
    if (category.id === 'getting-around') {
      onOpenMap();
      return;
    }
    onOpenCategory(category);
  };

  return (
    <main className="space-y-4 px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-3">
      <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#263B34_0%,#6A5268_54%,#B96C50_100%)] p-5 text-white shadow-[0_12px_32px_rgba(96,72,78,0.24)]">
        <svg aria-hidden="true" viewBox="0 0 400 210" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
          <circle cx="342" cy="20" r="66" fill="rgba(255,255,255,.10)" />
          <path d="M-25 174 C56 92 124 50 206 98 C286 144 332 110 430 36" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="34" strokeLinecap="round" />
          <path d="M-20 202 C80 118 160 102 236 136 C312 170 356 134 430 98" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md">
              <Compass className="h-4 w-4" />
              Visitor guide
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md">
              <Sparkles className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-9 max-w-[305px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">Welcome to Villaverde</p>
            <h1 className="mt-2 font-serif-header text-[31px] font-bold leading-[1.03]">Find the places worth stopping for.</h1>
            <p className="mt-3 text-sm font-medium leading-5 text-white/80">Discover local food, scenic routes, useful stops, and small-town finds.</p>
          </div>
        </div>
      </section>

      <CategoryList title="Explore Villaverde" categories={VISITOR_CATEGORIES} onOpenCategory={handleVisitorCategory} />

      <section className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onOpenModal('saved')} className="rounded-[24px] border border-[#D7DED4] bg-[#FFFDF7]/90 p-4 text-left shadow-xs backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#76527D]/20">
          <Heart className="h-5 w-5 text-[#A95E4B]" />
          <h3 className="mt-3 font-serif-header text-[17px] font-bold text-[#18241F]">Saved for later</h3>
          <p className="mt-1 text-xs font-medium leading-5 text-[#748078]">Keep places you want to remember.</p>
        </button>
        <button type="button" onClick={() => onOpenModal('nearby')} className="rounded-[24px] border border-[#D7DED4] bg-[#FFFDF7]/90 p-4 text-left shadow-xs backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">
          <LocateFixed className="h-5 w-5 text-[#2D6C55]" />
          <h3 className="mt-3 font-serif-header text-[17px] font-bold text-[#18241F]">Near me</h3>
          <p className="mt-1 text-xs font-medium leading-5 text-[#748078]">See what is close to your current stop.</p>
        </button>
      </section>
    </main>
  );
};
