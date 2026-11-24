import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, Sparkles, TrendingUp, Compass, Star,
  Clock, ArrowUpDown, Filter, RotateCcw, Check, ChevronRight, Zap, GraduationCap,
  History, Flame, Target
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import GigCard, { GigItem } from '../components/GigCard';
import GigSkeleton from '../components/GigSkeleton';
import EmptyState from '../components/EmptyState';

const CATEGORIES = [
  { id: 'all', name: 'All Domains' },
  { id: 'college_ml', name: 'Machine Learning' },
  { id: 'college_genai', name: 'Generative AI' },
  { id: 'college_agentic', name: 'Agentic AI' },
  { id: 'college_fullstack', name: 'Full-Stack Dev' },
  { id: 'college_backend', name: 'Technical Mentoring' },
  { id: 'college_android', name: 'Android Apps' },
  { id: 'college_ds', name: 'Data Science' },
  { id: 'college_other', name: 'Career Guidance' },
  { id: 'school_assignment', name: 'School Curriculum' },
];

const EXAMPLE_QUERIES = [
  'Python tutoring under ₹500',
  'Machine learning project guidance',
  'Java programming mentor',
  'Resume review with delivery within two days',
  'Class 10th Mathematics'
];

const SKILL_OPTIONS = [
  'Python', 'Machine Learning', 'React', 'FastAPI', 'Java', 'Spring Boot',
  'LeetCode', 'Resume', 'Streamlit', 'Class 10th', 'Mathematics', 'Firebase',
  'Docker', 'SQL', 'LangChain', 'PowerBI'
];

export const ExploreGigs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('campusgig_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minRating, setMinRating] = useState<number | ''>('');
  const [maxDeliveryDays, setMaxDeliveryDays] = useState<number | ''>('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Data State
  const [gigs, setGigs] = useState<GigItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [parsedQueryInfo, setParsedQueryInfo] = useState<{
    original: string;
    clean_keyword: string;
    max_price: number | null;
    max_days: number | null;
  } | null>(null);

  // Recommendations State (Loaded when on All view with no active search)
  const [recommendations, setRecommendations] = useState<{
    recommended_for_you: GigItem[];
    based_on_interests: GigItem[];
    trending_gigs: GigItem[];
    ai_reasoning: string;
  } | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync category from route location state if passed (e.g. from navbar or landing page)
  useEffect(() => {
    const locState = location.state as { category?: string; query?: string } | null;
    if (locState?.category) {
      setSelectedCategory(locState.category);
    }
    if (locState?.query) {
      setSearchInput(locState.query);
      setSubmittedQuery(locState.query);
    }
  }, [location.state]);

  // Autocomplete fetcher with debounce
  useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/gigs/suggestions', { params: { q: searchInput.trim() } });
        setSuggestions(res.data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Personalized AI Recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoadingRecs(true);
      try {
        const viewed = localStorage.getItem('campusgig_recent_views') || '';
        const searches = recentSearches.slice(0, 4).join(',');
        const res = await api.get('/gigs/recommendations', {
          params: { recent_searches: searches, recent_views: viewed }
        });
        setRecommendations(res.data);
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchRecommendations();
  }, [recentSearches]);

  // Fetch Filtered Gigs
  const fetchFilteredGigs = async () => {
    setLoadingGigs(true);
    try {
      const params: Record<string, any> = {
        sort_by: sortBy,
        limit: 24,
      };

      if (submittedQuery.trim()) params.q = submittedQuery.trim();
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedDomain !== 'all') params.domain = selectedDomain;
      if (minPrice !== '') params.min_price = minPrice;
      if (maxPrice !== '') params.max_price = maxPrice;
      if (minRating !== '') params.min_rating = minRating;
      if (maxDeliveryDays !== '') params.max_delivery_days = maxDeliveryDays;
      if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');

      const res = await api.get('/gigs', { params });
      setGigs(res.data.gigs || []);
      setTotalCount(res.data.total || 0);
      setParsedQueryInfo(res.data.parsed_query || null);
    } catch (err) {
      console.error('Failed to search gigs', err);
      setGigs([]);
      setTotalCount(0);
    } finally {
      setLoadingGigs(false);
    }
  };

  useEffect(() => {
    fetchFilteredGigs();
  }, [submittedQuery, selectedCategory, selectedDomain, minPrice, maxPrice, minRating, maxDeliveryDays, selectedSkills, sortBy]);

  const handleExecuteSearch = (q: string) => {
    const clean = q.trim();
    setSubmittedQuery(clean);
    setShowSuggestions(false);

    if (clean) {
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.toLowerCase() !== clean.toLowerCase());
        const updated = [clean, ...filtered].slice(0, 6);
        try {
          localStorage.setItem('campusgig_recent_searches', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSubmittedQuery('');
    setParsedQueryInfo(null);
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    setSubmittedQuery('');
    setSelectedCategory('all');
    setSelectedDomain('all');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setMaxDeliveryDays('');
    setSelectedSkills([]);
    setSortBy('relevance');
    setParsedQueryInfo(null);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const removeRecentSearch = (e: React.MouseEvent, sToRemove: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== sToRemove);
      localStorage.setItem('campusgig_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const isAnyFilterActive = Boolean(
    submittedQuery ||
    selectedCategory !== 'all' ||
    selectedDomain !== 'all' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    minRating !== '' ||
    maxDeliveryDays !== '' ||
    selectedSkills.length > 0 ||
    sortBy !== 'relevance'
  );

  const activeFiltersCount = (
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedDomain !== 'all' ? 1 : 0) +
    (minPrice !== '' || maxPrice !== '' ? 1 : 0) +
    (minRating !== '' ? 1 : 0) +
    (maxDeliveryDays !== '' ? 1 : 0) +
    selectedSkills.length +
    (sortBy !== 'relevance' ? 1 : 0)
  );

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Search Header Banner */}
      <section className="bg-gradient-to-b from-white via-indigo-50/20 to-slate-50 pt-10 pb-8 px-4 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Mentorship Led by Founder Datta Hadke
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Explore Academic Offerings &amp; Custom Sprints
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              100% verified capstone project architectures, IEEE documentation, and school syllabus solutions personally guided by Datta Hadke.
            </p>
          </div>

          {/* Intelligent Natural Language Search Bar */}
          <div className="max-w-2xl mx-auto relative" ref={searchBoxRef}>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleExecuteSearch(searchInput);
              }}
              className="relative flex items-center bg-white rounded-2xl shadow-lg shadow-indigo-500/5 border border-slate-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50 transition-all overflow-hidden"
            >
              <div className="pl-4 pr-2 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Try: 'Python tutoring under ₹500' or 'Machine learning project'..."
                className="w-full py-4 pr-10 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 sm:px-6 py-3.5 m-1 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5"
              >
                Search
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-40 overflow-hidden divide-y divide-slate-100 animate-slide-up">
                <div className="px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Suggestions
                </div>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchInput(s);
                      handleExecuteSearch(s);
                    }}
                    className="w-full text-left px-4 py-3 text-xs sm:text-sm font-medium text-slate-700 hover:bg-indigo-50/70 hover:text-brand-700 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      {s}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Example Searches & Recent History */}
          <div className="max-w-3xl mx-auto space-y-2">
            {recentSearches.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> Recent:
                </span>
                {recentSearches.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchInput(s);
                      handleExecuteSearch(s);
                    }}
                    className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 text-[11px] font-semibold transition-all shadow-xs"
                  >
                    <span>{s}</span>
                    <span
                      onClick={e => removeRecentSearch(e, s)}
                      className="text-slate-300 group-hover:text-slate-500 hover:text-rose-500 p-0.5"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Popular Searches:
              </span>
              {EXAMPLE_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchInput(q);
                    handleExecuteSearch(q);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-brand-500 hover:text-brand-700 text-[11px] font-medium transition-all shadow-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* NLP Parsed Query Constraints Badge */}
          {parsedQueryInfo && (parsedQueryInfo.max_price !== null || parsedQueryInfo.max_days !== null) && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-brand-900 font-medium">
                  <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>
                    Smart Query Applied: {parsedQueryInfo.clean_keyword && `"${parsedQueryInfo.clean_keyword}" `}
                    {parsedQueryInfo.max_price !== null && `• Max Price: ₹${parsedQueryInfo.max_price} `}
                    {parsedQueryInfo.max_days !== null && `• Delivery: Within ${parsedQueryInfo.max_days} Days`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-brand-700 font-bold hover:underline shrink-0 text-[11px]"
                >
                  Reset NLP Filter
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Category Tabs & Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          {/* Scrollable Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Action Controls: Filters & Sort */}
          <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setShowFiltersPanel(prev => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                showFiltersPanel || activeFiltersCount > 0
                  ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popularity">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-transparent transition-all"
                title="Reset All Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Filters Panel */}
        {showFiltersPanel && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-600" /> Advanced Filter Options
              </h3>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs text-brand-600 font-bold hover:underline"
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Budget Range (₹ INR)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Min ₹"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Max ₹"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Delivery Speed */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Delivery Speed</label>
                <select
                  value={maxDeliveryDays}
                  onChange={e => setMaxDeliveryDays(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-brand-500"
                >
                  <option value="">Any Delivery Time</option>
                  <option value="1">Express (Within 24 Hours)</option>
                  <option value="2">Within 2 Days</option>
                  <option value="3">Within 3 Days</option>
                  <option value="5">Within 5 Days</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Minimum Rating</label>
                <select
                  value={minRating}
                  onChange={e => setMinRating(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-brand-500"
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ Stars & Verified</option>
                  <option value="4.8">4.8+ Top Rated</option>
                  <option value="5.0">5.0 Star Perfection</option>
                </select>
              </div>

              {/* Academic Domain */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Academic Domain</label>
                <select
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-brand-500"
                >
                  <option value="all">All Domains</option>
                  <option value="College Engineering">College Engineering</option>
                  <option value="School (Class 1-10th)">School (Class 1-10th)</option>
                  <option value="Technical Mentoring">Technical Mentoring</option>
                </select>
              </div>
            </div>

            {/* Skills Tags Multi-Select */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">Filter by Specific Skills & Tags</label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(skill => {
                  const isChecked = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        isChecked
                          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {skill} {isChecked && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {isAnyFilterActive ? 'Search & Filter Results' : 'Explore All Verified Gigs'}
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {totalCount} Gigs Available
            </span>
          </div>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* GIGS GRID */}
        {loadingGigs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <GigSkeleton key={i} />
            ))}
          </div>
        ) : gigs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gigs.map(gig => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        ) : (
          <div className="py-12">
            <EmptyState
              icon={Search}
              title="No matching gigs found"
              description="Try adjusting your keywords, price filter, or delivery time. All gigs on CampusGig are verified database records."
              actionText="Reset All Filters"
              onAction={handleClearAllFilters}
            />
          </div>
        )}

        {/* PERSONALIZED AI RECOMMENDATIONS SECTIONS (Shown when browsing generally) */}
        {!isAnyFilterActive && recommendations && (
          <div className="space-y-12 pt-10 border-t border-slate-200">
            
            {/* 1. Recommended for You */}
            {recommendations.recommended_for_you.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                        Recommended for You
                      </h3>
                      <p className="text-xs text-slate-500">
                        {recommendations.ai_reasoning}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 w-fit">
                    AI Personalized Match
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendations.recommended_for_you.map(gig => (
                    <GigCard key={`rec-${gig.id}`} gig={gig} />
                  ))}
                </div>
              </div>
            )}

            {/* 2. Trending on Campus */}
            {recommendations.trending_gigs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                        Trending on Campus
                      </h3>
                      <p className="text-xs text-slate-500">
                        Highest order velocity and top verified review scores this week.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    🔥 Hot
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendations.trending_gigs.map(gig => (
                    <GigCard key={`trend-${gig.id}`} gig={gig} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Based on Your Interests */}
            {recommendations.based_on_interests.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                        Based on Your Interests
                      </h3>
                      <p className="text-xs text-slate-500">
                        Matched to your viewed skills, search history, and curriculum domain.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    Interest Aligned
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendations.based_on_interests.map(gig => (
                    <GigCard key={`int-${gig.id}`} gig={gig} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default ExploreGigs;
