import React from 'react';

export interface QuickActionProps {
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({ label, icon: Icon, color, onClick }) => (
  <div className="flex flex-col items-center">
    <button
      type="button"
      onClick={onClick}
      className="group flex h-14 w-14 touch-manipulation items-center justify-center rounded-full text-white shadow-md transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-black/15"
      style={{
        backgroundColor: color,
        boxShadow: `0 8px 18px ${color}45`,
      }}
      aria-label={label}
    >
      <Icon className="h-6 w-6 transition-transform group-hover:scale-110" />
    </button>
    <span className="mt-2 flex min-h-8 max-w-[92px] items-start justify-center text-center text-xs font-semibold leading-4 text-[#26372F]">{label}</span>
  </div>
);
