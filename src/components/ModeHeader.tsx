import React from 'react';
import { ArrowLeft, ArrowRight, ArrowRightLeft, Compass, Home, Users } from 'lucide-react';
import type { AppMode } from '../types/app';

export const BrandMark: React.FC<{ mode: AppMode }> = ({ mode }) => {
  const isHome = mode === 'home';
  const suffix = mode === 'ko' ? 'Ko' : mode === 'mo' ? 'Mo' : '';
  const suffixColor = mode === 'ko' ? 'text-[#2B6A4E]' : 'text-[#76527D]';
  const subtitle = isHome ? 'Local Guide' : mode === 'ko' ? 'For Locals' : 'For Visitors';

  const alignmentClass = isHome
    ? 'items-center text-center'
    : mode === 'ko'
      ? 'items-start text-left'
      : 'items-end text-right';
  const rowAlignmentClass = isHome ? 'justify-center' : mode === 'ko' ? 'justify-start' : 'justify-end';

  return (
    <div
      className={`flex h-11 select-none flex-col justify-center leading-none ${alignmentClass}`}
      aria-label={`${isHome ? 'myVillaverde' : `Villaverde${suffix}`} ${subtitle}`}
    >
      <div className={`flex items-baseline whitespace-nowrap leading-none ${rowAlignmentClass}`}>
        {isHome && (
          <span className="font-sans text-[26px] font-black tracking-[-0.04em] text-[#18241F]">my</span>
        )}
        <span
          className={`font-sans text-[26px] font-black tracking-[-0.045em] ${
            isHome ? 'text-[#2B6A4E]' : 'text-[#18241F]'
          }`}
        >
          Villaverde
        </span>
        {!isHome && (
          <span className={`font-sans text-[26px] font-black tracking-[-0.045em] ${suffixColor}`}>
            {suffix}
          </span>
        )}
      </div>
      <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.24em] text-[#66746B]">
        {subtitle}
      </span>
    </div>
  );
};

export interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const ModeSwitchButton: React.FC<{
  label: string;
  icon: React.ElementType;
  tone: 'local' | 'visitor';
  onClick: () => void;
}> = ({ label, icon: Icon, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`grid h-11 w-11 place-items-center rounded-full border bg-[#FFFDF7]/90 shadow-xs transition-all hover:bg-[#FFFDF7] active:scale-95 focus:outline-none focus-visible:ring-4 ${
      tone === 'local'
        ? 'border-[#C7D8CB] text-[#2B6A4E] focus-visible:ring-[#2B6A4E]/20'
        : 'border-[#D8CDDA] text-[#76527D] focus-visible:ring-[#76527D]/20'
    }`}
    aria-label={label}
  >
    <Icon className="h-5 w-5" />
  </button>
);

export const HomeButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="grid h-11 w-11 place-items-center rounded-full border border-[#CDD7CF] bg-[#FFFDF7]/90 text-[#405047] shadow-xs transition-all hover:bg-[#FFFDF7] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#405047]/20"
    aria-label="Return to myVillaverde"
  >
    <Home className="h-5 w-5" />
  </button>
);

export const ModeHeader: React.FC<HeaderProps> = ({ mode, onModeChange }) => (
  <header className="sticky top-0 z-30 bg-[#EEF1E8]/90 px-4 pb-2.5 pt-[max(1.125rem,env(safe-area-inset-top))] backdrop-blur-md">
    {mode === 'home' && (
      <div className="grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex justify-start">
          <ModeSwitchButton
            label="Open VillaverdeKo for locals"
            icon={Users}
            tone="local"
            onClick={() => onModeChange('ko')}
          />
        </div>

        <div style={{ animation: 'brandFade .32s ease-out both' }}>
          <BrandMark mode="home" />
        </div>

        <div className="flex justify-end">
          <ModeSwitchButton
            label="Open VillaverdeMo for visitors"
            icon={Compass}
            tone="visitor"
            onClick={() => onModeChange('mo')}
          />
        </div>
      </div>
    )}

    {mode === 'ko' && (
      <div className="flex min-h-12 items-center justify-between gap-3">
        <div className="ml-4 origin-left" style={{ animation: 'brandSlideLeft .42s cubic-bezier(.2,.8,.2,1) both' }}>
          <BrandMark mode="ko" />
        </div>

        <div className="flex items-center gap-2">
          <HomeButton onClick={() => onModeChange('home')} />
          <ModeSwitchButton
            label="Open VillaverdeMo for visitors"
            icon={Compass}
            tone="visitor"
            onClick={() => onModeChange('mo')}
          />
        </div>
      </div>
    )}

    {mode === 'mo' && (
      <div className="flex min-h-12 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ModeSwitchButton
            label="Open VillaverdeKo for locals"
            icon={Users}
            tone="local"
            onClick={() => onModeChange('ko')}
          />
          <HomeButton onClick={() => onModeChange('home')} />
        </div>

        <div className="mr-4 origin-right" style={{ animation: 'brandSlideRight .42s cubic-bezier(.2,.8,.2,1) both' }}>
          <BrandMark mode="mo" />
        </div>
      </div>
    )}
  </header>
);
