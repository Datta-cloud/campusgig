import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Shield, Clock, BrainCircuit, MessageCircle, ArrowRight, X, Eye, EyeOff,
  CheckCircle2, Star, Sparkles, FileText, Presentation, Code2, Users, Mic, Award,
  ChevronRight, Check, Play, BookOpen, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const domains = [
  {
    icon: '🎯',
    badge: 'Trending Capstone',
    title: 'Computer Vision & YOLOv9',
    desc: 'Autonomous Drone Detection, Rogue UAV Tracking, Real-Time Object Classification with PyTorch & OpenCV.',
    tech: ['YOLOv9', 'PyTorch', 'OpenCV', 'CUDA'],
    price: '₹2,499'
  },
  {
    icon: '🧠',
    badge: 'High Demand',
    title: 'Generative AI & Agentic RAG',
    desc: 'Multi-Document Hybrid RAG with Vector Search, LangGraph Autonomous Agents, & Gemini 3.8 Flash.',
    tech: ['LangChain', 'FAISS', 'Gemini 3.8', 'FastAPI'],
    price: '₹2,999'
  },
  {
    icon: '⚡',
    badge: 'Popular',
    title: 'Full-Stack MERN & Cloud',
    desc: 'Production-ready SaaS marketplaces, Role-Based Dashboards, Supabase PostgreSQL, & Docker pipelines.',
    tech: ['React 18', 'TypeScript', 'Node/Python', 'Supabase'],
    price: '₹2,199'
  },
  {
    icon: '📱',
    badge: 'Mobile Systems',
    title: 'Android & Cross-Platform',
    desc: 'Jetpack Compose native Android applications, Firebase Auth, Room DB, & Offline-First caching.',
    tech: ['Kotlin', 'Compose', 'Firebase', 'MVVM'],
    price: '₹2,499'
  },
  {
    icon: '🔗',
    badge: 'Fintech & Web3',
    title: 'Blockchain & Smart Contracts',
    desc: 'Decentralized Voting, Supply Chain Ledger, Solidity Smart Contracts, & Metamask Web3 integration.',
    tech: ['Solidity', 'Hardhat', 'Ethers.js', 'Web3'],
    price: '₹3,199'
  },
  {
    icon: '📚',
    badge: 'School & Foundation',
    title: 'School Project Reports',
    desc: 'Class 6-10 typed scientific project reports, research summaries, and diagram chart attachments.',
    tech: ['LaTeX PDF', 'Chart Graphics', 'Clean Bibliography'],
    price: '₹399'
  },
];

const deliverablesHighlights = [
  {
    id: 'code',
    label: '💻 Full Source Code IDE',
    title: 'Uncompressed Modular Source Code',
    description: 'Clean PEP8/TypeScript code with comprehensive docstrings, modular MVC/FastAPI architecture, requirements.txt, and setup scripts.',
    bullet1: '✓ In-browser Code Explorer with line-by-line viva explanations',
    bullet2: '✓ Includes Dockerfile & professional GitHub README.md template'
  },
  {
    id: 'ieee',
    label: '📑 IEEE Format Paper',
    title: 'Ready-to-Publish IEEE Research Report',
    description: 'Standard 6-page two-column academic paper with abstract, literature review, mathematical modeling, confusion matrices, and citations.',
    bullet1: '✓ Strictly <5% Turnitin plagiarism guaranteed',
    bullet2: '✓ In-browser Academic Rewriter tool for custom revisions'
  },
  {
    id: 'ppt',
    label: '📊 18-Slide Presentation',
    title: 'External Viva Defense Slide Deck',
    description: 'Aesthetic widescreen PowerPoint presentation deck with system architecture diagrams, performance graphs, and hidden speaker notes.',
    bullet1: '✓ Tailored speaker scripts for each slide so you never freeze',
    bullet2: '✓ Auto-generated SVG Level-0/1 DFD & ER diagrams attached'
  },
  {
    id: 'viva',
    label: '🎙️ Spoken Viva Defense Bot',
    title: 'Real-Time External Examiner Simulator',
    description: 'AI voice examiner asks grueling defense questions about your project model, math formulas, and hyperparameters with instant grading.',
    bullet1: '✓ Speech-to-Text & Text-to-Speech audio simulation',
    bullet2: '✓ 15+ domain questions with examiner tips & model answers'
  }
];

type Tab = 'student' | 'admin';
type AuthMode = 'login' | 'register';

const LandingPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<Tab>('student');
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTabDeliverable, setActiveTabDeliverable] = useState(0);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', username: '',
    student_type: 'college' as 'school' | 'college',
    college_name: '', college_branch: '', school_class: '', phone: '',
  });

  // Autofill credentials (Admin only)
  useEffect(() => {
    if (tab === 'admin') {
      const savedAdminUser = localStorage.getItem('cg_saved_admin_user') || 'admin';
      const savedAdminPass = localStorage.getItem('cg_saved_admin_pass') || 'Admin@CampusGig2026';
      setForm(f => ({ ...f, email: savedAdminUser, password: savedAdminPass }));
    } else {
      setForm(f => ({ ...f, email: '', password: '' }));
    }
  }, [tab, showModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleQuickFill = (user: string, pass: string) => {
    setForm(f => ({ ...f, email: user, password: pass }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'admin') {
        await login(form.email, form.password);
        navigate('/admin');
      } else if (mode === 'login') {
        await login(form.email, form.password);
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
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-brand-500 selection:text-white">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-bold py-2.5 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">CampusGig 2.0</span>
        <span>India's Premier Academic Engineering Capstone Marketplace • 30% Advance Booking • Turnitin-Safe</span>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-600/30 to-purple-600/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Tech Live Badge */}
          <div className="inline-flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-4 py-2 rounded-full text-xs font-bold text-slate-200 mb-8 backdrop-blur-md shadow-inner transition-all">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-extrabold">LIVE</span>
            <span className="text-slate-400">|</span>
            <span>Powered by Gemini 3.8 Flash & Razorpay Verified Payments</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6">
            Build Your Capstone with <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              100% Viva Defense Confidence
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            From <strong>Autonomous Drone Detection (YOLOv9)</strong> to <strong>Agentic RAG & Full-Stack MERN</strong> — get clean, uncompressed source code, 18-slide PPT, IEEE paper, & automated viva defense questions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <button
              onClick={() => { setShowModal(true); setTab('student'); setMode('login'); }}
              className="w-full sm:w-auto btn-primary px-8 py-4 text-base font-bold shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 rounded-2xl group"
            >
              <Zap className="w-5 h-5 text-yellow-300" />
              <span>Explore Projects & Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => { setShowModal(true); setTab('student'); setMode('login'); handleQuickFill('ananya_cse', 'Student@2026'); }}
              className="w-full sm:w-auto btn-secondary px-6 py-4 text-sm font-bold bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700 rounded-2xl flex items-center justify-center gap-2"
            >
              <span>Instant Demo View (Ananya)</span>
            </button>
          </div>

          {/* Trust Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-md text-left">
              <div className="text-2xl font-black text-white mb-1">500+</div>
              <div className="text-xs font-bold text-slate-400">Engineering Colleges</div>
              <p className="text-[11px] text-slate-500 mt-1">VIIT, BITS, COEP, IITs & NITs</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-md text-left">
              <div className="text-2xl font-black text-emerald-400 mb-1">99.4%</div>
              <div className="text-xs font-bold text-slate-400">Viva Pass Rate</div>
              <p className="text-[11px] text-slate-500 mt-1">AI Defense Question Simulators</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-md text-left">
              <div className="text-2xl font-black text-purple-400 mb-1">&lt; 5%</div>
              <div className="text-xs font-bold text-slate-400">Turnitin Plagiarism</div>
              <p className="text-[11px] text-slate-500 mt-1">Strict IEEE 2-Column Standards</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-md text-left">
              <div className="text-2xl font-black text-amber-400 mb-1">30%</div>
              <div className="text-xs font-bold text-slate-400">Advance Booking</div>
              <p className="text-[11px] text-slate-500 mt-1">Pay balance after seeing your code</p>
            </div>
          </div>

        </div>
      </div>

      {/* Interactive Deliverables Showcase */}
      <div className="py-20 bg-slate-950 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">What You Receive</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Complete Capstone Package in One Workspace
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3">
              We don't just email a ZIP file. You get an interactive workspace with live in-browser preview, academic paper generator, and viva audio coaching.
            </p>
          </div>

          {/* Deliverables Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {deliverablesHighlights.map((d, idx) => (
              <button
                key={d.id}
                onClick={() => setActiveTabDeliverable(idx)}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTabDeliverable === idx
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Active Deliverable Preview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2.5 py-1 rounded-md">
                  Deliverable Spec #{activeTabDeliverable + 1}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">
                  {deliverablesHighlights[activeTabDeliverable].title}
                </h3>
              </div>
              <button
                onClick={() => { setShowModal(true); setTab('student'); }}
                className="btn-primary text-xs px-5 py-2.5 shrink-0"
              >
                Inspect Inside Workspace
              </button>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed py-6">
              {deliverablesHighlights[activeTabDeliverable].description}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800/60 text-xs sm:text-sm font-semibold text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{deliverablesHighlights[activeTabDeliverable].bullet1}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{deliverablesHighlights[activeTabDeliverable].bullet2}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Capstone Domains Section */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-2">Academic Catalogs</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Available Project Domains
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Every project includes tailored algorithms, trained model weights, evaluation curves, and source code.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map(d => (
            <div
              key={d.title}
              onClick={() => { setShowModal(true); setTab('student'); }}
              className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/20 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="text-3xl p-3 bg-slate-700/40 rounded-2xl">{d.icon}</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                    {d.badge}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors mb-2">
                  {d.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-5">
                  {d.desc}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {d.tech.map(t => (
                    <span key={t} className="text-[10px] font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700/50">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-700/40 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Starting from:</span>
                  <span className="text-base font-black text-white">{d.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Journey */}
      <div className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">Safe & Transparent</span>
            <h2 className="text-3xl font-extrabold text-white">How CampusGig Works</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 font-black flex items-center justify-center text-sm mb-4 border border-blue-500/30">1</div>
              <h4 className="font-bold text-white text-base mb-1">Scope & 30% Advance</h4>
              <p className="text-xs text-slate-400 leading-relaxed">AI structures requirements into milestones. Pay only 30% advance via UPI/Razorpay to begin development.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 font-black flex items-center justify-center text-sm mb-4 border border-purple-500/30">2</div>
              <h4 className="font-bold text-white text-base mb-1">Mentor Engineering</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Senior engineers develop code, train models, draft 18-slide PPT, and compile the IEEE paper report.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 font-black flex items-center justify-center text-sm mb-4 border border-amber-500/30">3</div>
              <h4 className="font-bold text-white text-base mb-1">Inspect In-Browser</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Review source files in the in-browser IDE. Click "Explain for Viva" on any line to master your defense.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 font-black flex items-center justify-center text-sm mb-4 border border-emerald-500/30">4</div>
              <h4 className="font-bold text-white text-base mb-1">Settle & 100% Unlock</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Pay the 70% balance (or in flexible partial milestones) to unlock the full uncompressed code repository ZIP.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-black text-white text-base tracking-tight">CampusGig</span>
            <span className="text-slate-500 ml-2">© {new Date().getFullYear()} CampusGig Academic Systems</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => { setShowModal(true); setTab('student'); }} className="hover:text-white transition-colors">Student Login</button>
            <button onClick={() => { setShowModal(true); setTab('admin'); }} className="hover:text-white transition-colors">Admin Portal</button>
            <span className="text-emerald-400 font-bold">● System Operational</span>
          </div>
        </div>
      </footer>

      {/* Login / Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
          <div className="relative bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Close button */}
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>

            {/* Portal Tab Switcher */}
            <div className="flex border-b border-slate-800 bg-slate-950/50">
              <button
                onClick={() => { setTab('student'); setError(''); setMode('login'); }}
                className={`flex-1 py-4 text-xs font-bold transition-all ${tab === 'student' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                🎓 Student Portal
              </button>
              <button
                onClick={() => { setTab('admin'); setError(''); setMode('login'); }}
                className={`flex-1 py-4 text-xs font-bold transition-all ${tab === 'admin' ? 'text-purple-400 border-b-2 border-purple-500 bg-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                🔑 Admin Terminal
              </button>
            </div>

            <div className="p-6">
              
              {/* Quick Fill Demo Helper */}
              {tab === 'student' ? (
                <div className="mb-5 p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-center justify-between">
                  <div className="text-[11px] text-blue-200">
                    <strong>Demo Student:</strong> Ananya Mukherjee
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('ananya_cse', 'Student@2026')}
                    className="text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg"
                  >
                    Quick Autofill
                  </button>
                </div>
              ) : (
                <div className="mb-5 p-3 rounded-xl bg-purple-950/40 border border-purple-900/60 flex items-center justify-between">
                  <div className="text-[11px] text-purple-200">
                    <strong>Master Admin:</strong> Administrator
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin', 'Admin@CampusGig2026')}
                    className="text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-lg"
                  >
                    Quick Autofill
                  </button>
                </div>
              )}

              {/* Login/Register Mode Toggle for Students */}
              {tab === 'student' && (
                <div className="flex bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    New Student
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs font-semibold mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && tab === 'student' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="e.g. Ananya Mukherjee"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="e.g. ananya_cse"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">College Name</label>
                      <input
                        type="text"
                        name="college_name"
                        value={form.college_name}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="e.g. VIIT Pune / BITS Pilani"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {tab === 'admin' ? 'Admin Username' : 'Username or Email'}
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder={tab === 'admin' ? 'admin' : 'ananya_cse'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="input-field pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3.5 text-sm font-bold mt-2 shadow-lg"
                >
                  {loading ? 'Authenticating...' : mode === 'login' ? `Login to ${tab === 'admin' ? 'Admin Terminal' : 'Workspace'}` : 'Create Student Account'}
                </button>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
