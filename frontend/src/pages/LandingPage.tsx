import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield, Clock, BrainCircuit, MessageCircle, ArrowRight, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  // Autofill credentials from localStorage (Admin only)
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
      setError(err?.response?.data?.detail || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 mb-6 text-sm font-medium">
            <Zap className="w-4 h-4" />
            Your Personal Tech Mentor & Academic Project Partner
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            Campus<span className="text-yellow-300">Gig</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Expert project delivery for college students & school kids — ML, GenAI, Web Dev, Android & beyond
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {['✅ 30% Advance Only', '🤖 AI-Powered Scope', '💬 1-on-1 Live Chat', '⚡ Express Delivery'].map(b => (
              <span key={b} className="bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-medium">{b}</span>
            ))}
          </div>

          {/* Two big cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => { setShowModal(true); setTab('student'); }}
              className="group bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 rounded-2xl p-8 text-left transition-all hover:scale-105 hover:shadow-2xl"
            >
              <div className="text-5xl mb-4">🎓</div>
              <h2 className="text-2xl font-bold mb-2">College Students</h2>
              <p className="text-blue-100 text-sm mb-4">ML, GenAI, Full-Stack, Android & More</p>
              <span className="inline-flex items-center gap-1 text-yellow-300 font-semibold text-sm group-hover:gap-2 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={() => { setShowModal(true); setTab('student'); }}
              className="group bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 rounded-2xl p-8 text-left transition-all hover:scale-105 hover:shadow-2xl"
            >
              <div className="text-5xl mb-4">🎒</div>
              <h2 className="text-2xl font-bold mb-2">School Students</h2>
              <p className="text-blue-100 text-sm mb-4">Class 1-10 Assignments, Reports & Projects</p>
              <span className="inline-flex items-center gap-1 text-yellow-300 font-semibold text-sm group-hover:gap-2 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Services</h2>
          <p className="text-gray-500">Professional project delivery across all domains</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.title} className="card hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group">
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{s.title}</h3>
              <p className="text-gray-500 text-sm mb-3">{s.desc}</p>
              <span className="font-bold text-blue-600">{s.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="text-white font-bold text-lg">CampusGig</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} CampusGig. Your academic success partner.</p>
      </footer>

      {/* Login/Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
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

            <div className="p-6">
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'student' && mode === 'register' && (
                  <>
                    <input name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} className="input-field" required />
                    <input name="username" placeholder="Username" value={form.username} onChange={handleChange} className="input-field" required />
                    <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} className="input-field" />
                    <select name="student_type" value={form.student_type} onChange={handleChange} className="input-field">
                      <option value="college">🎓 College Student</option>
                      <option value="school">🎒 School Student</option>
                    </select>
                    {form.student_type === 'college' ? (
                      <>
                        <input name="college_name" placeholder="College Name" value={form.college_name} onChange={handleChange} className="input-field" />
                        <input name="college_branch" placeholder="Branch (e.g. CSE, IT)" value={form.college_branch} onChange={handleChange} className="input-field" />
                      </>
                    ) : (
                      <input name="school_class" placeholder="Class (e.g. Class 8)" value={form.school_class} onChange={handleChange} className="input-field" />
                    )}
                  </>
                )}

                {/* 1-Click Quick Fill Helper - ADMIN ONLY */}
                {tab === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin', 'Admin@CampusGig2026')}
                    className="w-full text-xs py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold border border-purple-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    ⚡ 1-Click Auto-Fill Admin Credentials
                  </button>
                )}

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

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base font-bold shadow-md shadow-brand-500/20">
                  {loading ? 'Please wait...' : tab === 'admin' ? '🔑 Admin Login' : mode === 'login' ? '🚀 Sign In' : '✨ Create Account'}
                </button>
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
