import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Heart, ShieldCheck, ArrowRight, CheckCircle2, Bookmark } from 'lucide-react';

export interface GigItem {
  id: string;
  category_key: string;
  category_name: string;
  title: string;
  domain: string;
  description: string;
  thumbnail: string;
  starting_price: number;
  delivery_time: string;
  rating: number;
  reviews_count: number;
  mentor: {
    name: string;
    avatar: string;
    role: string;
    verified: boolean;
  };
  tags: string[];
}

interface GigCardProps {
  gig: GigItem;
  onSaveToggle?: (gigId: string, isSaved: boolean) => void;
  onSelect?: (gig: GigItem) => void;
}

export const GigCard: React.FC<GigCardProps> = ({ gig, onSaveToggle, onSelect }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cg_saved_gigs') || '[]');
      return saved.includes(gig.id);
    } catch {
      return false;
    }
  });

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      const saved: string[] = JSON.parse(localStorage.getItem('cg_saved_gigs') || '[]');
      const updated = nextSaved ? [...new Set([...saved, gig.id])] : saved.filter(id => id !== gig.id);
      localStorage.setItem('cg_saved_gigs', JSON.stringify(updated));
    } catch {}

    if (onSaveToggle) {
      onSaveToggle(gig.id, nextSaved);
    }
  };

  const handleOrderClick = () => {
    if (onSelect) {
      onSelect(gig);
      return;
    }
    // Navigate to order wizard with category pre-selected
    navigate('/order/new', {
      state: {
        categoryKey: gig.category_key,
        studentType: gig.category_key === 'school_assignment' ? 'school' : 'college',
        initialTitle: gig.title,
      }
    });
  };

  return (
    <div
      onClick={handleOrderClick}
      className="group bg-white rounded-3xl border border-slate-200/90 hover:border-brand-500/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Thumbnail Header with Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={gig.thumbnail}
          alt={gig.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
            {gig.category_name}
          </span>
        </div>

        {/* Save Gig Button */}
        <button
          type="button"
          onClick={handleSaveClick}
          aria-label={isSaved ? 'Remove from saved' : 'Save gig'}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 ${
            isSaved
              ? 'bg-rose-500 text-white border-rose-400 shadow-md scale-105'
              : 'bg-slate-900/60 text-white/90 border-white/20 hover:bg-white hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Delivery speed pill at bottom of thumbnail */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/90 text-xs font-semibold drop-shadow-sm">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-[11px]">{gig.delivery_time} Delivery</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        {/* Mentor Row */}
        <div className="flex items-center gap-2.5">
          <img
            src={gig.mentor.avatar}
            alt={gig.mentor.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-800 truncate">{gig.mentor.name}</span>
              {gig.mentor.verified && (
                <span title="Verified CampusGig Mentor">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate">{gig.mentor.role}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80 shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="text-xs font-black text-amber-900">{gig.rating}</span>
            <span className="text-[10px] text-slate-400">({gig.reviews_count})</span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
            {gig.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed font-normal">
            {gig.description}
          </p>
        </div>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {gig.tags.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors"
            >
              {tag}
            </span>
          ))}
          {gig.tags.length > 4 && (
            <span className="text-[10px] text-slate-400 font-medium self-center">
              +{gig.tags.length - 4}
            </span>
          )}
        </div>

        {/* Bottom Bar: Price & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Starting at</span>
            <span className="text-base font-black text-slate-900 tracking-tight">
              ₹{gig.starting_price.toLocaleString('en-IN')}
            </span>
            {gig.category_key === 'school_assignment' && (
              <span className="text-[10px] text-slate-400 block font-medium -mt-0.5">10 Pages Base</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOrderClick();
            }}
            className="btn-primary text-xs px-3.5 py-2 font-bold flex items-center gap-1.5 shadow-sm group-hover:shadow-md transition-all active:scale-95"
          >
            <span>View & Order</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default GigCard;
