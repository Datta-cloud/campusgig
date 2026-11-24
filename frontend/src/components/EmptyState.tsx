import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, Search, PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h3 className="font-extrabold text-slate-900 text-lg">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {actionText && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              to={actionHref}
              className="btn-primary inline-flex items-center text-xs sm:text-sm px-5 py-2.5 font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
            >
              {actionText}
            </Link>
          ) : onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="btn-primary text-xs sm:text-sm px-5 py-2.5 font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
            >
              {actionText}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
