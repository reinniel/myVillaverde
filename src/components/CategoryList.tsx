import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { GuideCategory } from '../types/app';

export interface CategoryListProps {
  title: string;
  categories: GuideCategory[];
  onOpenCategory: (category: GuideCategory) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ title, categories, onOpenCategory }) => (
  <section className="space-y-2.5">
    <div className="px-1 pt-1">
      <h2 className="font-serif-header text-[21px] font-bold text-[#18241F]">{title}</h2>
    </div>
    {categories.map((category) => {
      const Icon = category.icon;
      return (
        <button type="button" key={category.id} onClick={() => onOpenCategory(category)} className="group flex w-full items-center justify-between rounded-[24px] border border-[#D9E0D8] bg-[#FFFDF7] p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6A4E]/20">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${category.tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-serif-header text-[17px] font-bold leading-5 text-[#18241F]">{category.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs font-medium leading-4 text-[#748078]">{category.description}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#627066] transition-transform group-hover:translate-x-0.5" />
        </button>
      );
    })}
  </section>
);


