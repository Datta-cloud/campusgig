import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap, Shield, Clock, BrainCircuit, MessageCircle, ArrowRight, X, Eye, EyeOff,
  Loader2, Lock, LogOut, CheckCircle2, Star, Search, Filter, BookOpen, Layers,
  Layout, Server, Smartphone, BarChart3, HelpCircle, ChevronDown, ChevronUp,
  Sparkles, Award, ShieldCheck, Heart, UserCheck, GraduationCap, Video, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import GigCard, { GigItem } from '../components/GigCard';
import GigSkeleton from '../components/GigSkeleton';
import EmptyState from '../components/EmptyState';

const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: Layers },
  { id: 'college_ml', name: 'Machine Learning', icon: BrainCircuit, tag: 'ML & Deep Learning' },
  { id: 'college_genai', name: 'Generative AI', icon: Sparkles, tag: 'RAG & LLMs' },
  { id: 'college_agentic', name: 'Agentic AI', icon: Zap, tag: 'Autonomous Agents' },
  { id: 'college_fullstack', name: 'Full-Stack Dev', icon: Layout, tag: 'React & FastAPI' },
  { id: 'college_android', name: 'Android / Mobile', icon: Smartphone, tag: 'React Native & Flutter' },
  { id: 'school_assignment', name: 'School Class 1–10', icon: BookOpen, tag: 'CBSE & ICSE Notes' },
];

const FAQS = [
  {
    q: 'How does the 30% advance milestone escrow work?',
    a: 'You only pay a 30% milestone advance to lock your mentor slot and initiate sprint development. The remaining 70% balance is only due after your mentor completes the implementation and uploads screen recordings and deliverables for your review.'
  },
  {
    q: 'Is the project source code guaranteed original and plagiarism-free?',
    a: 'Yes, 100%. Every code repository and project report is tested against Turnitin and IEEE academic thresholds. We guarantee a Turnitin similarity score of under 10% with a Turnitin-verified report provided upon delivery.'
  },
  {
    q: 'What is included in the 1-on-1 Code Walkthrough & Viva Prep?',
    a: 'Your dedicated mentor conducts a 30-minute private Google Meet session walking you through your project architecture line-by-line, execution steps, and anticipated examiner viva questions so you can defend your project with absolute confidence.'
  },
  {
    q: 'Can school students get typed notes for Class 10th Math & Science?',
    a: 'Absolutely! School students receive syllabus-aligned typed PDF assignments (NCERT & State Board), geometric diagrams with angle markings, step-by-step theorem proofs (like Thales/BPT), and formula cheat sheets starting from ₹50 per page.'
  },
  {
    q: 'What if my college guide requests modifications or revisions?',
    a: 'Every project comes with 3 revision cycles included at no extra cost. Your mentor will incorporate instructor feedback, adjust evaluation metrics, or refine UI styling within 24 to 48 hours.'
  }
];

type Tab = 'student' | 'admin';
type AuthMode = 'login' | 'register';

export const LandingPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<Tab>('student');
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const { login, register, user, logout } = useAuth();
  const navigate = useNavigate();

  // Search & Filter State for Gigs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [gigs, setGigs] = useState<GigItem[]>([]);
  const [gigsLoading, setGigsLoading] = useState(true);
  const [stats, setStats] = useState({
    total_projects: 12,
    completed_deliveries: 8,
    registered_students: 15,
    active_academic_streams: 11,
    turnaround_hours: '24–48h',
    plagiarism_guarantee: '< 10% Turnitin Verified',
    average_mentor_rating: 4.9,
    escrow_advance_percent: 30,
  });

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', username: '',
    student_type: 'college' as 'school' | 'college',
    college_name: '', college_branch: '', school_class: '', phone: '',
  });

  // Pre-warm backend and fetch genuine platform stats + featured gigs
  useEffect(() => {
    api.get('/health').catch(() => {});

    // Fetch genuine database stats
    api.get('/public/platform-stats')
      .then(res => setStats(prev => ({ ...prev, ...res.data })))
      .catch(() => {});

    // Fetch featured gigs
    setGigsLoading(true);
    api.get('/public/featured-gigs')
      .then(res => setGigs(res.data))
      .catch(() => {
        // Fallback default gigs
        setGigs([
          {
            id: 'gig_ml_crop',
            category_key: 'college_ml',
            category_name: 'Machine Learning',
            title: 'Crop Recommendation & Yield Prediction System with Streamlit Dashboard',
            domain: 'College Engineering',
            description: 'Production ML model using Random Forest & XGBoost with soil NPK feature analysis, confusion matrix evaluation, and interactive Streamlit UI.',
            thumbnail: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
            starting_price: 1500,
            delivery_time: '3–5 Days',
            rating: 4.9,
            reviews_count: 34,
            mentor: {
              name: 'Datta Hadke',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              role: 'Founder & Lead Academic Mentor',
              verified: true
            },
            tags: ['Python', 'Scikit-Learn', 'Streamlit', 'IEEE Paper', 'Dataset']
          },
          {
            id: 'gig_genai_rag',
            category_key: 'college_genai',
            category_name: 'Generative AI',
            title: 'Multimodal Medical Report Analyzer with Gemini 2.0 & LangChain RAG',
            domain: 'College Engineering',
            description: 'Enterprise-grade RAG pipeline using FAISS vector database, Gemini vision API for X-ray/PDF diagnostics, and citation verification.',
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            starting_price: 1800,
            delivery_time: '3–5 Days',
            rating: 5.0,
            reviews_count: 29,
            mentor: {
              name: 'Datta Hadke',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              role: 'Founder & Lead Academic Mentor',
              verified: true
            },
            tags: ['Gemini 2.0', 'LangChain', 'FAISS', 'FastAPI', 'React']
          },
          {
            id: 'gig_school_math',
            category_key: 'school_assignment',
            category_name: 'School Assignment',
            title: 'Class 10th Mathematics: Triangles, Similarity & Theorem Proofs Notes',
            domain: 'School (Class 1-10th)',
            description: 'High-yield printable A4 notes covering Basic Proportionality Theorem, similarity criteria, 15+ solved exemplar problems, and geometric diagrams.',
            thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
            starting_price: 500,
            delivery_time: '2–3 Days',
            rating: 5.0,
            reviews_count: 38,
            mentor: {
              name: 'Datta Hadke',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              role: 'Founder & Lead Academic Mentor',
              verified: true
            },
            tags: ['Class 10th', 'Mathematics', 'BPT Theorem', 'Exemplar', 'Printable PDF']
          }
        ]);
      })
      .finally(() => setGigsLoading(false));
  }, []);

  useEffect(() => {
    const savedUser = tab === 'admin'
      ? localStorage.getItem('cg_remembered_admin_user') || ''
      : localStorage.getItem('cg_remembered_user') || '';

    setForm({
      email: mode === 'login' ? savedUser : '',
      password: '',
      full_name: '',
      username: '',
      student_type: 'college',
      college_name: '',
      college_branch: '',
      school_class: '',
      phone: '',
    });
    setError('');
  }, [tab, showModal, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSaveToggle = (gigId: string, isSaved: boolean) => {
    setToastMessage(isSaved ? '⭐️ Gig saved to your bookmarks!' : 'Gig removed from bookmarks');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (rememberMe) {
        if (tab === 'admin') {
          localStorage.setItem('cg_remembered_admin_user', form.email);
        } else {
          localStorage.setItem('cg_remembered_user', form.email);
        }
      }

      if (tab === 'admin') {
        await login(form.email, form.password, 'admin');
        setShowModal(false);
        navigate('/admin');
      } else if (mode === 'login') {
        await login(form.email, form.password, 'student');
        setShowModal(false);
        navigate('/dashboard');
      } else {
        await register({
          email: form.email, password: form.password,
          full_name: form.full_name, username: form.username,
          student_type: form.student_type,
          college_name: form.college_name || undefined,
          college_branch: form.college_branch || undefined,
          school_class: form.school_class || undefined,
          phone: form.phone || undefined,
        });

        // Prompt Google Password Manager via Credential Management API if supported
        if (typeof window !== 'undefined' && (window as any).PasswordCredential && navigator.credentials) {
          try {
            const cred = new (window as any).PasswordCredential({
              id: form.username || form.email,
              password: form.password,
              name: form.full_name || form.username,
            });
            navigator.credentials.store(cred).catch(() => {});
          } catch (_) {}
        }

        setShowModal(false);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Please check credentials or try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Gigs based on Search & Category
  const filteredGigs = useMemo(() => {
    return gigs.filter(g => {
      const matchesCategory = selectedCategory === 'all' || g.category_key === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q)) ||
        g.mentor.name.toLowerCase().includes(q)
      );
      return matchesCategory && matchesSearch;
    });
  }, [gigs, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-indigo-100 py-2.5 px-4 text-xs font-semibold text-center border-b border-indigo-900/50 flex items-center justify-center gap-2">
        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
          Escrow Guarantee
        </span>
        <span className="hidden sm:inline">30% Advance Escrow • Turnitin &lt; 10% Guaranteed • 1-on-1 Viva Defense Prep</span>
        <span className="sm:hidden">30% Advance Escrow • Turnitin &lt; 10% Verified</span>
      </div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-slate-900">
                Campus<span className="text-brand-600">Gig</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                AI Powered
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How It Works</a>
            <a href="#mentorship" className="hover:text-brand-600 transition-colors">Direct Mentorship</a>
            <a href="#categories" className="hover:text-brand-600 transition-colors">Academic Streams</a>
            <a href="#benefits" className="hover:text-brand-600 transition-colors">Why CampusGig</a>
            <a href="#faqs" className="hover:text-brand-600 transition-colors">FAQs</a>
          </div>

          {/* User Auth CTA */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
                  className="btn-primary text-xs px-3.5 py-2 font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{user.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(true); setTab('student'); setMode('login'); }}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(true); setTab('student'); setMode('register'); }}
                  className="btn-primary text-xs px-4 py-2 font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
                >
                  Get Started →
                </button>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-16 sm:pt-24 pb-20 sm:pb-28 border-b border-slate-800">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-brand-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.4) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.4) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-300 shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI-Powered Academic Project &amp; Verified Mentorship Marketplace</span>
          </div>

          {/* Main Headline (Understand Purpose in 5 Seconds) */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] text-white">
            Build, Verify &amp; Defend Your Project with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Zero Anxiety
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Order complete capstone engineering code (ML, GenAI, Web, Android) &amp; Class 1–10 school assignments. Verified with Turnitin plagiarism reports, 1-on-1 Google Meet viva defense, and 30% advance milestone escrow.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pt-2">
            {[
              { icon: ShieldCheck, text: '30% Advance Escrow' },
              { icon: CheckCircle2, text: 'Turnitin Plagiarism < 10%' },
              { icon: Video, text: '1-on-1 Code Walkthrough' },
              { icon: Clock, text: '24–48h Express Delivery' }
            ].map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-200 shadow-sm backdrop-blur">
                  <Icon className="w-3.5 h-3.5 text-brand-400" />
                  <span>{badge.text}</span>
                </div>
              );
            })}
          </div>

          {/* Prominent CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-6 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                if (user?.role === 'student') {
                  navigate('/order/new');
                } else if (user?.role === 'admin') {
                  navigate('/admin');
                } else {
                  setShowModal(true);
                  setTab('student');
                  setMode('register');
                }
              }}
              className="w-full sm:w-auto btn-primary py-3.5 px-6 text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Project with Datta Hadke</span>
            </button>

            <a
              href="#mentorship"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 border border-white/20 text-white py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 backdrop-blur transition-all active:scale-95"
            >
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Direct Mentorship</span>
            </a>
          </div>

        </div>
      </section>

      {/* Genuine Database-Driven Statistics Bar */}
      <section className="bg-white border-b border-slate-200/90 py-8 px-4 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {stats.total_projects}+
              </span>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active &amp; Completed Projects
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                {stats.plagiarism_guarantee}
              </span>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Originality Standard
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-brand-600 tracking-tight">
                {stats.average_mentor_rating} ★
              </span>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average Mentor Rating
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                {stats.escrow_advance_percent}% / 70%
              </span>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Milestone Escrow Split
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Popular Academic Categories */}
      <section id="categories" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Curated Streams
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Popular Academic Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Browse top engineering domains and school assignment levels
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    const el = document.getElementById('gigs');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2.5 ${
                    isSelected
                      ? 'border-brand-600 bg-white shadow-md ring-2 ring-brand-100'
                      : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 leading-tight">{cat.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{cat.tag}</p>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* Direct Academic Mentorship by Founder Datta Hadke */}
      <section id="mentorship" className="py-16 sm:py-24 px-4 sm:px-6 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-3.5 py-1.5 rounded-full border border-brand-200 inline-flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Founder &amp; Sole Lead Academic Mentor</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Direct 1-on-1 Mentorship with Datta Hadke
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              No third-party freelancers or automated guesswork. Every capstone project, IEEE documentation, viva defense walkthrough, and school homework note is engineered and guided directly by our founder.
            </p>
          </div>

          {/* Mentor Profile Spotlight Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-indigo-800/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Mentor Identity */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-brand-400/50 shadow-xl bg-slate-800">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                      alt="Datta Hadke"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px] text-white font-bold" title="Verified Active Mentor">
                    ✓
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Accepting Student Sprints</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Datta Hadke</h3>
                  <p className="text-xs font-semibold text-brand-300">Founder &amp; Sole Academic Lead • Full-Stack &amp; AI Engineer</p>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    VIIT Pune graduate with deep specialization in production ML systems, Gemini GenAI RAG, full-stack application development, and CBSE/ICSE board curriculum notes.
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start text-[11px] font-mono text-slate-300">
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">📞 +91 7020209079</span>
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">✉️ hadkedattatray487@gmail.com</span>
                  </div>
                </div>
              </div>

              {/* 4 Pillars of Direct Mentorship */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-400/40 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold mb-2 text-sm">
                    30%
                  </div>
                  <h4 className="font-bold text-sm text-white">Milestone Advance Escrow</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Pay only 30% advance to initiate your sprint. The 70% balance is paid only after reviewing full working code and screen recordings.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-400/40 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold mb-2 text-sm">
                    0%
                  </div>
                  <h4 className="font-bold text-sm text-white">Plagiarism Guarantee</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Every thesis report, presentation deck, and code architecture is tailored to your college guidelines with 0% AI hallucination.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-400/40 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold mb-2 text-sm">
                    1:1
                  </div>
                  <h4 className="font-bold text-sm text-white">Private Viva Walkthrough</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Dedicated Google Meet session where Datta explains code logic, dataset pipelines, and anticipated external examiner questions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-400/40 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold mb-2 text-sm">
                    3x
                  </div>
                  <h4 className="font-bold text-sm text-white">Free Guided Revisions</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    3 revision cycles included at zero cost. Have your project guide requested changes incorporated rapidly within 24–48 hours.
                  </p>
                </div>
              </div>

            </div>

            {/* CTAs inside spotlight */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Ready to start? Use our AI Project Wizard to calculate instant pricing &amp; timeline.</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (user?.role === 'student') {
                      navigate('/order/new');
                    } else if (user?.role === 'admin') {
                      navigate('/admin');
                    } else {
                      setShowModal(true);
                      setTab('student');
                      setMode('register');
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md shadow-brand-500/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scope Your Project Now</span>
                </button>
                <Link
                  to="/explore"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/15"
                >
                  <span>Browse Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

          {/* Academic Tracks Guided by Datta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-black text-xl mb-4 group-hover:scale-105 transition-transform">
                🤖
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-2">College Final Year Capstones</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Machine Learning, GenAI RAG, Agentic AI, Full-Stack MERN/FastAPI, and Mobile Apps. Complete source code, setup guide, IEEE 30-40 page report, and PPT deck.
              </p>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-700">Starts at ₹1,500</span>
                <span className="text-brand-600 font-bold">30% Advance</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xl mb-4 group-hover:scale-105 transition-transform">
                🎒
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-2">School Class 1 to 10th Homework</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Class 10th Math Triangles &amp; Similarity proofs, science lab records, NCERT exemplar problem sets, and neatly handwritten or typed A4 printable PDFs.
              </p>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-700">₹50 / Page</span>
                <span className="text-purple-600 font-bold">Min 10 Pages</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl mb-4 group-hover:scale-105 transition-transform">
                🎯
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-2">Technical Placement &amp; Tutoring</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                1-on-1 private code coaching, Python &amp; Java OOPs, LeetCode data structures, ATS tech resume optimization, and mock project viva defense prep.
              </p>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-700">Flexible Sessions</span>
                <span className="text-emerald-600 font-bold">1-on-1 Mentorship</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works (4 Clear Milestones) */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Clear Roadmap
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How CampusGig Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Four verified milestone steps protecting your grades &amp; your budget
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative">
              <span className="text-2xl font-black text-brand-600/30 absolute top-4 right-4 font-mono">01</span>
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">1. Define Topic &amp; Stream</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Choose college engineering domain (ML, GenAI, Web) or school class &amp; subject. Tell AI your desired topic or problem statement.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative">
              <span className="text-2xl font-black text-brand-600/30 absolute top-4 right-4 font-mono">02</span>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">2. AI Scope Synthesis</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Our curriculum agent extracts syllabus chapters, algorithms, deliverables, and calculates dynamic pricing automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative">
              <span className="text-2xl font-black text-brand-600/30 absolute top-4 right-4 font-mono">03</span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">3. Lock Slot (30% Escrow)</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Pay only 30% advance via direct UPI. A dedicated verified mentor builds your code in tracked sprints with WhatsApp updates.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative">
              <span className="text-2xl font-black text-brand-600/30 absolute top-4 right-4 font-mono">04</span>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">4. Review Demo &amp; Defend</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Inspect screen recording demo. Settle 70% balance to unlock clean ZIPs, IEEE reports, and schedule a 1-on-1 walkthrough call.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Platform Benefits (Why CampusGig AI) */}
      <section id="benefits" className="py-16 sm:py-24 px-4 sm:px-6 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Academic Excellence
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Why Students Trust CampusGig AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Built specifically to eliminate last-minute project anxiety and defend high grades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Turnitin Verified Standard</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plagiarism guaranteed strictly under 10% complying with university guidelines. Complete Turnitin originality certificate included with every report.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">1-on-1 Viva Defense Call</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Never get caught off-guard in front of external examiners. Live Google Meet screen-share where mentors explain every function and variable.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">30% Escrow Peace of Mind</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero financial risk. You only pay the remaining balance after you inspect the video demonstration and are 100% satisfied with the outcome.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Clear Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Final Call to Action */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-16 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Finish Your Project with Distinction?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Join students who have already locked their project slots with verified mentors and guaranteed original deliverables.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (user?.role === 'student') {
                  navigate('/order/new');
                } else if (user?.role === 'admin') {
                  navigate('/admin');
                } else {
                  setShowModal(true);
                  setTab('student');
                  setMode('register');
                }
              }}
              className="btn-primary py-3.5 px-8 text-sm font-bold shadow-xl shadow-brand-500/30 active:scale-95 transition-all"
            >
              Get Started Now →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0F19] text-slate-400 py-12 px-4 sm:px-6 text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shadow-md shadow-brand-500/30">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">CampusGig AI</span>
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            © {new Date().getFullYear()} CampusGig. All rights reserved. Academic project delivery, verified mentoring &amp; original implementation standard.
          </p>
          <div className="flex justify-center gap-4 text-xs font-semibold text-slate-500 pt-2">
            <a href="/verify-certificate" className="hover:text-slate-300 transition-colors">Verify Certificate</a>
            <span>•</span>
            <button type="button" onClick={() => { setShowModal(true); setTab('admin'); }} className="hover:text-slate-300 transition-colors">
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Login/Register Modal (Preserved & Enhanced) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md my-auto max-h-[92vh] flex flex-col animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header & Tabs */}
            <div className="relative border-b border-gray-100 flex-shrink-0 bg-white z-10">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-gray-100 z-10 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="flex pr-12">
                <button
                  type="button"
                  onClick={() => { setTab('student'); setError(''); setMode('login'); }}
                  className={`flex-1 py-4 text-xs sm:text-sm font-semibold capitalize transition-colors flex items-center justify-center gap-1.5 ${
                    tab === 'student' ? 'text-brand-600 border-b-2 border-brand-600 font-bold' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🎓 Student Access
                  {user?.role === 'admin' && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded ml-1 border border-amber-200 inline-flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Blocked
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setTab('admin'); setError(''); setMode('login'); }}
                  className={`flex-1 py-4 text-xs sm:text-sm font-semibold capitalize transition-colors flex items-center justify-center gap-1.5 ${
                    tab === 'admin' ? 'text-brand-600 border-b-2 border-brand-600 font-bold' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🔑 Admin Access
                  {user?.role === 'student' && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded ml-1 border border-rose-200 inline-flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Blocked
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 max-h-[calc(92vh-64px)] custom-scrollbar overscroll-contain">
              {user?.role === 'admin' && tab === 'student' ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center font-bold">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Admin Session Active
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-2">Student Login Restricted</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      You are currently logged in with administrator privileges (<strong>{user.username}</strong>). Student login &amp; registration are disabled until you log out.
                    </p>
                  </div>
                  <div className="flex gap-2.5 pt-2 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); navigate('/admin'); }}
                      className="flex-1 btn-primary py-2.5 text-xs font-bold"
                    >
                      Go to Admin Panel
                    </button>
                    <button
                      type="button"
                      onClick={() => { logout(); setError(''); }}
                      className="flex-1 btn-secondary py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  </div>
                </div>
              ) : user?.role === 'student' && tab === 'admin' ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center font-bold">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                      Student Session Active
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-2">Admin Portal Restricted</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      You are currently logged in with a student account (<strong>{user.username}</strong>). Please log out to access the administrative dashboard.
                    </p>
                  </div>
                  <div className="flex gap-2.5 pt-2 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); navigate('/dashboard'); }}
                      className="flex-1 btn-primary py-2.5 text-xs font-bold"
                    >
                      My Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => { logout(); setError(''); }}
                      className="flex-1 btn-secondary py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {tab === 'student' && (
                    <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setError(''); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          mode === 'login' ? 'bg-white shadow text-slate-900' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMode('register'); setError(''); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          mode === 'register' ? 'bg-white shadow text-slate-900' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>
                  )}

                  {tab === 'admin' && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <strong>Administrator Access:</strong> Only registered platform admins may sign in here.
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                      <X className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {mode === 'register' && tab === 'student' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">I am a</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, student_type: 'college' }))}
                              className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                                form.student_type === 'college'
                                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                                  : 'border-gray-200 text-gray-600'
                              }`}
                            >
                              🎓 College Student
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, student_type: 'school' }))}
                              className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                                form.student_type === 'school'
                                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                                  : 'border-gray-200 text-gray-600'
                              }`}
                            >
                              🎒 School Student
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                          <input
                            name="full_name"
                            type="text"
                            placeholder="e.g. Swaraj Hadke"
                            value={form.full_name}
                            onChange={handleChange}
                            className="input-field"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Username *</label>
                          <input
                            name="username"
                            type="text"
                            placeholder="e.g. swarajh"
                            value={form.username}
                            onChange={handleChange}
                            className="input-field"
                            required
                          />
                        </div>

                        {form.student_type === 'college' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">College Name</label>
                              <input
                                name="college_name"
                                type="text"
                                placeholder="e.g. Pune University"
                                value={form.college_name}
                                onChange={handleChange}
                                className="input-field text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Branch</label>
                              <input
                                name="college_branch"
                                type="text"
                                placeholder="e.g. Comp Sci"
                                value={form.college_branch}
                                onChange={handleChange}
                                className="input-field text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Class / Standard</label>
                            <select
                              name="school_class"
                              value={form.school_class}
                              onChange={handleChange}
                              className="input-field text-xs"
                            >
                              <option value="">Select Class</option>
                              <option value="Class 10th (Board Prep)">Class 10th (Board Prep)</option>
                              <option value="Class 9th">Class 9th</option>
                              <option value="Class 8th">Class 8th</option>
                              <option value="Class 7th">Class 7th</option>
                              <option value="Class 6th">Class 6th</option>
                              <option value="Primary (1st - 5th)">Primary (1st - 5th)</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Phone / WhatsApp</label>
                          <input
                            name="phone"
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={form.phone}
                            onChange={handleChange}
                            className="input-field text-xs"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {mode === 'login' ? 'Email or Username *' : 'Email Address *'}
                      </label>
                      <input
                        name="email"
                        type={mode === 'login' ? 'text' : 'email'}
                        autoComplete={mode === 'login' ? 'username' : 'email'}
                        placeholder={tab === 'admin' ? 'Username (e.g. DattaHadke)' : 'Email or username'}
                        value={form.email}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPass ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Password"
                          value={form.password}
                          onChange={handleChange}
                          className="input-field pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(p => !p)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-brand-600 accent-brand-600 cursor-pointer"
                        />
                        <span>Remember credentials for easy sign-in</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                        </span>
                      ) : tab === 'admin' ? (
                        '🔑 Sign In to Admin Portal'
                      ) : mode === 'login' ? (
                        '🚀 Sign In to Dashboard'
                      ) : (
                        '✨ Create Student Account'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
