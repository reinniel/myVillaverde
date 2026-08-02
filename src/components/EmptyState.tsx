import React from 'react';

export interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message }) => (
  <div className="rounded-[28px] border border-[#D9E0D8] bg-[#FFFDF7] p-7 text-center shadow-xs">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EEF1E8] text-[#405047]">
      <Icon className="h-6 w-6" />
    </span>
    <h3 className="mt-4 font-serif-header text-xl font-bold text-[#18241F]">{title}</h3>
    <p className="mx-auto mt-2 max-w-[290px] text-sm font-medium leading-6 text-[#748078]">{message}</p>
  </div>
);
