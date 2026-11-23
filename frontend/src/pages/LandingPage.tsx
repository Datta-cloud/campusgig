import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield, Clock, BrainCircuit, MessageCircle, ArrowRight, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const services = [
  { icon: '🤖', title: 'Machine Learning', desc: 'CNN, NLP, Regression, Classification', price: '₹2,499+' },
  { icon: '🧠', title: 'Generative AI', desc: 'LLMs, RAG, Chatbots, Fine-tuning', price: '₹2,999+' },
  { icon: '🕵️', title: 'Agentic AI', desc: 'Multi-agent systems, AutoGen, LangGraph', price: '₹3,499+' },
  { icon: '💻', title: 'Web Development', desc: 'React, Next.js, Full-stack apps', price: '₹1,999+' },
  { icon: '📱', title: 'Android Dev', desc: 'Kotlin, Jetpack Compose, Firebase', price: '₹2,499+' },
  { icon: '📚', title: 'School Projects', desc: 'Class 1-10 assignments & reports', price: '₹299+' },
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
  const [rememberMe, setRememberMe] = useState(true);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', username: '',
    student_type: 'college' as 'school' | 'college',
    college_name: '', college_branch: '', school_class: '', phone: '',
  });

  // Pre-warm backend cloud server & autofill credentials
  useEffect(() => {
    // Ping health endpoint to instantly wake Render backend if sleeping
    api.get('/health').catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'register') {
      // Clear all fields for new registration so no demo credentials appear
      setForm({
        email: '', password: '', full_name: '', username: '',
        student_type: 'college', college_name: '', college_branch: '', school_class: '', phone: '',
      });
      return;
    }
    if (tab === 'admin') {
      const savedAdminUser = localStorage.getItem('cg_saved_admin_user') || 'admin';
      const savedAdminPass = localStorage.getItem('cg_saved_admin_pass') || 'Admin@CampusGig2026';
      setForm(f => ({ ...f, email: savedAdminUser, password: savedAdminPass }));
    } else {
      const savedStudentUser = localStorage.getItem('cg_saved_student_user') || 'ananya_cse';
      const savedStudentPass = localStorage.getItem('cg_saved_student_pass') || 'Student@2026';
      setForm(f => ({ ...f, email: savedStudentUser, password: savedStudentPass }));
    }
  }, [tab, showModal, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleQuickFill = (user: string, pass: string) => {
    setForm(f => ({ ...f, email: user, password: pass }));
  };

  const handleDirectLogin = async (user: string, pass: string) => {
    setForm(f => ({ ...f, email: user, password: pass }));
    setLoading(true);
    setError('');
    try {
      await login(user, pass);
      setShowModal(false);
      if (tab === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Server is waking up. Please click again in a few seconds.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (rememberMe) {
        if (tab === 'admin') {
          localStorage.setItem('cg_saved_admin_user', form.email);
          localStorage.setItem('cg_saved_admin_pass', form.password);
        } else if (mode === 'login') {
          localStorage.setItem('cg_saved_student_user', form.email);
          localStorage.setItem('cg_saved_student_pass', form.password);
        }
      }

      if (tab === 'admin') {
        await login(form.email, form.password);
        setShowModal(false);
        navigate('/admin');
      } else if (mode === 'login') {
        await login(form.email, form.password);
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

        // Save newly registered user to localStorage so their OWN credentials are remembered next time
        localStorage.setItem('cg_saved_student_user', form.username || form.email);
        localStorage.setItem('cg_saved_student_pass', form.password);

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
      setError(err?.response?.data?.detail || 'Server is waking up. Please click again in a few seconds.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0B0F19] text-white border-b border-slate-800/80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.4) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 backdrop-blur-md rounded-full px-4 py-2 mb-6 text-xs sm:text-sm font-semibold border border-slate-700/80 text-blue-300 shadow-sm transition-all">
            <Zap className="w-4 h-4 text-blue-400" />
            Your Personal Tech Mentor &amp; Academic Project Partner
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-5 leading-tight tracking-tight text-white">
            Campus<span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">Gig</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-normal leading-relaxed">
            Expert project delivery for college students &amp; school kids — ML, GenAI, Web Dev, Android &amp; beyond
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-12">
            {['✅ 30% Advance Only', '🤖 AI-Powered Scope', '💬 1-on-1 Live Chat', '⚡ Express Delivery'].map(b => (
              <span key={b} className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-full px-4 py-2 text-xs sm:text-sm font-medium backdrop-blur shadow-sm transition-colors">{b}</span>
            ))}
          </div>

          {/* Two big cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => { setShowModal(true); setTab('student'); }}
              className="group bg-slate-900/80 hover:bg-slate-850/90 backdrop-blur-xl border border-slate-700/70 hover:border-blue-500/60 rounded-2xl p-7 sm:p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 shadow-lg cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl mb-4 group-hover:scale-105 transition-transform">🎓</div>
              <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-blue-300 transition-colors">College Students</h2>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">ML, GenAI, Full-Stack, Android &amp; More</p>
              <span className="inline-flex items-center gap-1.5 text-blue-400 font-semibold text-sm group-hover:gap-2.5 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={() => { setShowModal(true); setTab('student'); }}
              className="group bg-slate-900/80 hover:bg-slate-850/90 backdrop-blur-xl border border-slate-700/70 hover:border-indigo-500/60 rounded-2xl p-7 sm:p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 shadow-lg cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4 group-hover:scale-105 transition-transform">🎒</div>
              <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-indigo-300 transition-colors">School Students</h2>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">Class 1-10 Assignments, Reports &amp; Projects</p>
              <span className="inline-flex items-center gap-1.5 text-indigo-400 font-semibold text-sm group-hover:gap-2.5 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/60 inline-block mb-3">
            What We Deliver
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Our Services</h2>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-2 max-w-lg mx-auto">Professional project delivery across all domains</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.title} className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/40 group cursor-pointer shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{s.icon}</div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{s.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 leading-relaxed">{s.desc}</p>
              <span className="inline-block font-extrabold text-blue-600 dark:text-blue-400 text-sm tracking-tight">{s.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0B0F19] text-slate-400 py-12 text-center border-t border-slate-800">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight">CampusGig</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">© {new Date().getFullYear()} CampusGig. Your academic success partner.</p>
      </footer>

      {/* Login/Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto max-h-[92vh] flex flex-col animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header & Tabs (Pinned at top) */}
            <div className="relative border-b border-gray-100 flex-shrink-0 bg-white z-10">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 z-10 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="flex pr-12">
                {(['student', 'admin'] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(''); setMode('login'); }}
                    className={`flex-1 py-4 text-sm font-semibold capitalize transition-colors ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t === 'student' ? '🎓 Student' : '🔑 Admin'} Login
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Form Body with own scroll */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 max-h-[calc(92vh-64px)] custom-scrollbar overscroll-contain">
              {tab === 'student' && (
                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
                  {(['login', 'register'] as AuthMode[]).map(m => (
                    <button key={m} onClick={() => { setMode(m); setError(''); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${mode === m ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
                      {m === 'login' ? 'Sign In' : 'Register'}
                    </button>
                  ))}
                </div>
              )}

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

              <form onSubmit={handleSubmit} method="POST" action="#" className="space-y-4">
                {tab === 'student' && mode === 'register' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                      <input
                        name="full_name"
                        type="text"
                        placeholder="Full Name (e.g. Rahul Sharma)"
                        value={form.full_name}
                        onChange={handleChange}
                        autoComplete="name"
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Username *</label>
                      <input
                        name="username"
                        type="text"
                        placeholder="Username (e.g. rahul_dev)"
                        value={form.username}
                        onChange={handleChange}
                        autoComplete="username"
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="Email Address (e.g. rahul@example.com)"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number (Optional)</label>
                      <input
                        name="phone"
                        type="tel"
                        placeholder="Phone (e.g. 9876543210)"
                        value={form.phone}
                        onChange={handleChange}
                        autoComplete="tel"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Student Category</label>
                      <select name="student_type" value={form.student_type} onChange={handleChange} className="input-field">
                        <option value="college">🎓 College Student (B.Tech, BCA, MCA, M.Tech)</option>
                        <option value="school">🎒 School Student (Class 6 - 12)</option>
                      </select>
                    </div>
                    {form.student_type === 'college' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input name="college_name" placeholder="College Name" value={form.college_name} onChange={handleChange} className="input-field" />
                        <input name="college_branch" placeholder="Branch (e.g. CSE, IT)" value={form.college_branch} onChange={handleChange} className="input-field" />
                      </div>
                    ) : (
                      <input name="school_class" placeholder="Class (e.g. Class 10)" value={form.school_class} onChange={handleChange} className="input-field" />
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Create Password *</label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPass ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Create Secure Password"
                          value={form.password}
                          onChange={handleChange}
                          className="input-field pr-10"
                          required
                        />
                        <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                        🔒 After registering, Google Password Manager will offer to save your credentials for automatic 1-click login!
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 1-Click Quick Fill & Direct Login Helper - STUDENT */}
                    {tab === 'student' && mode === 'login' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickFill('ananya_cse', 'Student@2026')}
                          className="flex-1 text-xs py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold border border-blue-200 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          ⚡ Auto-Fill Ananya
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleDirectLogin('ananya_cse', 'Student@2026')}
                          className="flex-1 text-xs py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Logging in...
                            </>
                          ) : (
                            '🚀 1-Click Direct Login'
                          )}
                        </button>
                      </div>
                    )}

                    {/* 1-Click Quick Fill & Direct Login Helper - ADMIN */}
                    {tab === 'admin' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickFill('admin', 'Admin@CampusGig2026')}
                          className="flex-1 text-xs py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold border border-purple-200 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          ⚡ Auto-Fill Admin
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleDirectLogin('admin', 'Admin@CampusGig2026')}
                          className="flex-1 text-xs py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Logging in...
                            </>
                          ) : (
                            '🚀 1-Click Direct Login'
                          )}
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {tab === 'admin' ? 'Admin Username' : 'Username or Email'}
                      </label>
                      <input
                        name="email"
                        type="text"
                        autoComplete="username"
                        placeholder={tab === 'admin' ? "Username (e.g. admin)" : "Username or Email"}
                        value={form.email}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
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
                        <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span>Remember credentials & auto-fill next time</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
                    </span>
                  ) : tab === 'admin' ? (
                    '🔑 Admin Login'
                  ) : mode === 'login' ? (
                    '🚀 Sign In'
                  ) : (
                    '✨ Create Account'
                  )}
                </button>
                {loading && (
                  <p className="text-[11px] text-center text-slate-500 animate-pulse">
                    Connecting to server... (Render cloud server waking up if idle)
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin quick link */}
      <button
        onClick={() => { setShowModal(true); setTab('admin'); }}
        className="fixed bottom-4 right-4 text-xs text-gray-400 hover:text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm"
      >
        Admin Login
      </button>
    </div>
  );
};

export default LandingPage;
