import React from 'react';

export const GigSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse flex flex-col">
      {/* Thumbnail placeholder */}
      <div className="aspect-[16/10] bg-slate-200 w-full" />

      {/* Body placeholder */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Mentor row */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="w-24 h-3 bg-slate-200 rounded" />
            <div className="w-16 h-2 bg-slate-200 rounded" />
          </div>
          <div className="w-12 h-5 bg-slate-200 rounded-lg" />
        </div>

        {/* Title & Desc */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-slate-200 rounded" />
          <div className="w-3/4 h-4 bg-slate-200 rounded" />
          <div className="w-full h-3 bg-slate-100 rounded mt-2" />
        </div>

        {/* Skill tags */}
        <div className="flex gap-2">
          <div className="w-12 h-4 bg-slate-200 rounded" />
          <div className="w-16 h-4 bg-slate-200 rounded" />
          <div className="w-10 h-4 bg-slate-200 rounded" />
        </div>

        {/* Bottom bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-2 bg-slate-200 rounded" />
            <div className="w-16 h-5 bg-slate-200 rounded" />
          </div>
          <div className="w-24 h-8 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default GigSkeleton;
