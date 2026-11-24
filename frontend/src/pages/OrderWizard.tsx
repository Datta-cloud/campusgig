import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2, Brain, Sparkles, Layout, Server, Layers, Smartphone, BarChart3,
  BookOpen, Clock, CheckCircle2, ChevronRight, ChevronLeft, ArrowRight,
  ShieldCheck, AlertCircle, RefreshCw, QrCode, CreditCard, Send, Check, Tag, Zap, Copy
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLLEGE_DOMAINS = [
  { id: 'college_ml', name: 'Machine Learning', icon: Brain, desc: 'Classification, Regression, CNN, Predictive models', example: 'i.e., "Crop Recommendation System using Soil NPK values & Random Forest"' },
  { id: 'college_genai', name: 'Generative AI & RAG', icon: Sparkles, desc: 'LLM apps, PDF Q&A bots, LangChain, Embeddings', example: 'i.e., "Multimodal Medical Report Analyzer using Gemini & RAG Vector Search"' },
  { id: 'college_agentic', name: 'Agentic AI Systems', icon: Layers, desc: 'Autonomous multi-agent workflows, AutoGen, CrewAI', example: 'i.e., "Autonomous Research & Code Generation Agent with tool calling"' },
  { id: 'college_fullstack', name: 'Full-Stack Web Dev', icon: Layout, desc: 'FastAPI/Node + React/Next.js, PostgreSQL/MongoDB', example: 'i.e., "Hospital Management & Patient Appointment Portal with Billing"' },
  { id: 'college_frontend', name: 'Frontend Web Dev', icon: Code2, desc: 'High-performance React/Tailwind, Responsive UI', example: 'i.e., "Fintech Analytics Dashboard with Recharts & Dark Theme"' },
  { id: 'college_backend', name: 'Backend & REST APIs', icon: Server, desc: 'FastAPI, Express, JWT Auth, Microservices, DB', example: 'i.e., "Scalable E-Commerce Backend with Inventory & Webhooks"' },
  { id: 'college_android', name: 'Android / Mobile App', icon: Smartphone, desc: 'React Native / Flutter, Firebase auth, SQLite', example: 'i.e., "Campus Food Delivery & Mess Attendance Mobile App"' },
  { id: 'college_ds', name: 'Data Science & BI', icon: BarChart3, desc: 'EDA, Pandas, PowerBI/Streamlit interactive dashboard', example: 'i.e., "Stock Market Trend Prediction & Portfolio Risk Analysis"' },
];

const SCHOOL_SUBJECTS = ['Science & Physics', 'Computer Science & Coding', 'Social Science & History', 'Mathematics', 'Environmental Studies (EVS)', 'English Literature'];
const SCHOOL_CLASSES = ['Class 1st to 5th (Primary)', 'Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th (Board Prep)'];

const SCHOOL_ADDONS = [
  {
    id: 'notes_pdf',
    name: 'Typed Structured Notes & Assignment PDF',
    desc: 'High-yield theoretical notes, theorem proofs, and neatly formatted printable PDF',
    priceLabel: 'Included',
    isIncluded: true,
  },
  {
    id: 'chart_diagrams',
    name: 'Geometric Figures, Diagrams & Chart Design',
    desc: 'Neat geometric constructions, angle markings & printable chart illustrations',
    priceLabel: '+₹150',
    isIncluded: false,
  },
  {
    id: 'solved_questions',
    name: 'Step-by-Step Solved Theorem Proofs & Exemplar Questions',
    desc: '15+ solved textbook & board exemplar questions with full marking-scheme steps',
    priceLabel: '+₹100',
    isIncluded: false,
  },
  {
    id: 'formula_sheet',
    name: 'Formula Cheat Sheet & Quick-Revision Theorem Card',
    desc: '2-page rapid-revision formula card with all theorems, postulates, and shortcuts',
    priceLabel: '+₹100',
    isIncluded: false,
  },
  {
    id: 'concept_call',
    name: '1-on-1 Concept Doubt Clearing Session (30 Mins)',
    desc: 'Live interactive video session with top academic mentor to solve doubts and practice',
    priceLabel: '+₹250',
    isIncluded: false,
  },
];

const COLLEGE_ADDONS = [
  {
    id: 'code',
    name: 'Source Code & Setup Guide',
    desc: 'Full clean code with README execution steps and environment setup',
    priceLabel: 'Included',
    isIncluded: true,
  },
  {
    id: 'report',
    name: 'Project Report (IEEE Format)',
    desc: '30-40 pages documentation with architecture diagrams & bibliography',
    priceLabel: '+₹500',
    isIncluded: false,
  },
  {
    id: 'ppt',
    name: 'Presentation PPT Slides',
    desc: '15-20 professional slides with system architecture diagrams',
    priceLabel: '+₹350',
    isIncluded: false,
  },
  {
    id: 'viva_guide',
    name: 'Viva / Exam Question Guide',
    desc: 'Top 30 expected viva examiner Q&A with deep conceptual answers',
    priceLabel: '+₹300',
    isIncluded: false,
  },
  {
    id: 'walkthrough_call',
    name: '1-on-1 Code Walkthrough Call',
    desc: '30-min live Google Meet code walkthrough and question defense',
    priceLabel: '+₹400',
    isIncluded: false,
  },
];

interface AiScopeData {
  refined_title: string;
  tech_stack: string[];
  deliverables_detail: string[];
  timeline_days: number;
  methodology: string;
  suggested_improvements: string[];
}

const getSchoolFallbackScope = (
  title: string,
  schoolClass: string,
  schoolSubject: string,
  pageCount: number
): AiScopeData => {
  const cleanTitle = title.trim();
  const lower = (cleanTitle + ' ' + schoolSubject).toLowerCase();

  let tech_stack = [
    'NCERT & State Board Aligned (2025-26)',
    'CBSE Pattern Mark-Distribution',
    'Step-by-Step Proof Layout',
    'Printable A4 Format'
  ];
  let deliverables_detail = [
    `${pageCount}-Page High-Yield Structured Notes (Printable PDF)`,
    'Neat Geometric Diagrams & Figure Illustrations with Clear Labels',
    '15+ Solved Textbook Exemplar & Previous Year Board Questions',
    'Rapid Revision Formula Cheat Sheet & Theorem Memory Cards'
  ];
  let methodology = 'Concept Breakdown → Theorem Statement → Given/To Prove/Construction → Step-by-Step Proofs → Exemplar Applications';
  let suggested_improvements = [
    'Include 5 high-frequency previous 5-year Board Exam questions with step marking',
    'Add QR codes linking to visual concept walkthrough animations'
  ];

  if (schoolSubject.includes('Math') || lower.includes('math') || lower.includes('triangle') || lower.includes('similar') || lower.includes('line') || lower.includes('parallel')) {
    tech_stack = [
      'Basic Proportionality Theorem (Thales)',
      'Converse of BPT Theorem',
      'Similarity Criteria (AAA, SSS, SAS)',
      'Parallel Lines & Transversals Postulates',
      'Ratio of Areas of Similar Triangles',
      'Pythagoras Theorem Connections'
    ];
    deliverables_detail = [
      `${pageCount}-Page Comprehensive ${schoolClass} Mathematics Notes (PDF)`,
      'High-Precision Geometric Diagrams with Transversal Angle Markings',
      '15+ Solved Board Exemplar Problems with Step-by-Step Reasons',
      'Formula & Theorem Cheat Sheet with Quick Mnemonics',
      'Practice Exercise with 10 Targeted Multiple-Choice & Long-Answer Questions'
    ];
    methodology = 'Rigorous Geometric Proofs Framework: Given → To Prove → Construction → Step-by-Step Proof with Euclidean Axioms';
    suggested_improvements = [
      'Add step-by-step proofs for converse of Thales theorem',
      'Include previous year 5-mark board question solutions with common error warnings'
    ];
  } else if (schoolSubject.includes('Science') || lower.includes('science') || lower.includes('physics') || lower.includes('chem') || lower.includes('bio')) {
    tech_stack = [
      'Core Scientific Principles & Laws',
      'Well-Labeled High-Res Ray Diagrams & Schematics',
      'Real-World Applications & Daily Life Examples',
      'NCERT Intext & Chapter-End Solved Questions'
    ];
    deliverables_detail = [
      `${pageCount}-Page Illustrated Science Theory & Experiment Notes`,
      'Handcrafted High-Quality Vector Diagrams & Flowcharts',
      'Solved Numerical Problems with Unit Conversions',
      'Quick Formula & Key Terms Revision Sheet'
    ];
    methodology = 'Scientific Inquiry Model: Definition → Core Laws → Working Principle → Diagrammatic Illustration → Numerical Practice';
    suggested_improvements = [
      'Include laboratory experiment setup procedures and observations',
      'Add mind-maps for 5-minute pre-exam memory recall'
    ];
  }

  return {
    refined_title: cleanTitle ? `${cleanTitle} - ${schoolClass} Master Curriculum Notes` : `${schoolSubject} - ${schoolClass} Academic Notes`,
    tech_stack,
    deliverables_detail,
    timeline_days: 3,
    methodology,
    suggested_improvements,
  };
};

const getDomainFallbackScope = (title: string, domainId: string): AiScopeData => {
  let tech_stack = ['Python', 'FastAPI', 'React', 'Tailwind CSS'];
  let deliverables_detail = ['Complete Working Source Code', 'Project Report PDF (IEEE Format)', 'PowerPoint Presentation Slides (PPT)'];
  let methodology = 'Agile Sprint Methodology with Milestone Demonstration';
  let suggested_improvements = ['Add responsive dark mode theme', 'Include unit and integration test suite'];

  if (domainId === 'college_ml') {
    tech_stack = ['Python', 'Scikit-Learn', 'Pandas', 'NumPy', 'Flask / FastAPI', 'Streamlit UI'];
    deliverables_detail = ['Complete Python Source Code', 'Trained ML Model (.pkl / .joblib)', 'Model Evaluation & Confusion Matrix Report', 'Interactive Prediction UI'];
    methodology = 'CRISP-DM (Cross-Industry Standard Process for Data Mining)';
    suggested_improvements = ['Include feature importance analysis', 'Implement cross-validation'];
  } else if (domainId === 'college_genai' || domainId === 'college_agentic') {
    tech_stack = ['Python', 'Google Gemini 2.0 API', 'LangChain', 'FAISS Vector DB', 'FastAPI', 'React'];
    deliverables_detail = ['RAG Knowledge Pipeline & Embeddings', 'Prompt Templates & Context Manager', 'Autonomous Multi-Tool Agent Logic', 'Full Web Dashboard'];
    methodology = 'Retrieval-Augmented Generation (RAG) & Agentic Architecture';
    suggested_improvements = ['Add conversation memory cache', 'Include citation & confidence score indicators'];
  } else if (domainId === 'college_fullstack') {
    tech_stack = ['React (TypeScript)', 'Node.js / FastAPI', 'PostgreSQL / Supabase', 'Tailwind CSS'];
    deliverables_detail = ['Frontend Web Application', 'REST API Backend Architecture', 'Database Schema & Migrations', 'Role-Based Authentication (JWT)'];
    methodology = 'Modular Full-Stack Architecture with CI/CD Workflow';
    suggested_improvements = ['Add real-time websocket updates', 'Integrate payment gateway'];
  } else if (domainId === 'college_frontend') {
    tech_stack = ['React 18', 'TypeScript', 'Tailwind CSS', 'Vite', 'Lucide Icons'];
    deliverables_detail = ['Pixel-Perfect Responsive UI', 'Component Library & State Management', 'Clean Documentation & Demo Video'];
    methodology = 'Component-Driven Development with Atomic Design';
    suggested_improvements = ['Add dark mode theme switch', 'Ensure 100% Lighthouse accessibility score'];
  } else if (domainId === 'college_backend') {
    tech_stack = ['FastAPI', 'Python', 'PostgreSQL', 'SQLAlchemy', 'JWT', 'Docker'];
    deliverables_detail = ['RESTful API Endpoints', 'Database Models & Alembic Migrations', 'Swagger / OpenAPI Documentation', 'Postman Collection'];
    methodology = 'Clean Architecture with Layered Service Pattern';
    suggested_improvements = ['Add Redis caching layer', 'Implement rate limiting and API security'];
  } else if (domainId === 'college_android') {
    tech_stack = ['React Native', 'TypeScript', 'Expo', 'Firebase', 'Tailwind'];
    deliverables_detail = ['Mobile App APK (Android)', 'Complete React Native Source Code', 'Firebase Backend Integration', 'Setup & Run Guide'];
    methodology = 'Cross-Platform Mobile Development Lifecycle';
    suggested_improvements = ['Add push notifications', 'Support offline caching'];
  } else if (domainId === 'college_ds') {
    tech_stack = ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Streamlit Dashboard'];
    deliverables_detail = ['Exploratory Data Analysis (EDA) Notebook', 'Data Cleaning & Feature Engineering Pipeline', 'Interactive Analytics Dashboard', 'Summary Insights Report'];
    methodology = 'Data Science Lifecycle: EDA → Feature Engineering → Modeling → Visualization';
    suggested_improvements = ['Add predictive trend forecasting', 'Include interactive export to PDF/CSV'];
  }

  const cleanTitle = title.trim();
  return {
    refined_title: cleanTitle ? `${cleanTitle} - Capstone Implementation` : 'Academic Capstone Project',
    tech_stack,
    deliverables_detail,
    timeline_days: 7,
    methodology,
    suggested_improvements,
  };
};

export const OrderWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refiningAi, setRefiningAi] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Form State - Autofilled from user profile if available
  const [studentType, setStudentType] = useState<'college' | 'school'>('college');
  const [categoryKey, setCategoryKey] = useState('college_ml');
  const [schoolClass, setSchoolClass] = useState('Class 10th (Board Prep)');
  const [schoolSubject, setSchoolSubject] = useState('Science & Physics');
  const [pageCount, setPageCount] = useState(10);

  // Autofill student type and class on load
  useEffect(() => {
    if (user?.student_type) {
      setStudentType(user.student_type as 'college' | 'school');
      if (user.student_type === 'school' && user.school_class) {
        setSchoolClass(user.school_class);
      }
    }
  }, [user]);

  const [projectTitle, setProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [urgency, setUrgency] = useState<'normal' | 'express' | 'super_express'>('normal');

  // Add-ons selection
  const [selectedAddons, setSelectedAddons] = useState<string[]>(() =>
    studentType === 'school' ? ['notes_pdf'] : ['code']
  );

  // Sync selectedAddons when studentType changes
  useEffect(() => {
    if (studentType === 'school') {
      setSelectedAddons(prev => {
        const cleaned = prev.filter(k => !['code', 'report', 'ppt', 'viva_guide', 'walkthrough_call'].includes(k));
        return cleaned.includes('notes_pdf') ? cleaned : ['notes_pdf', ...cleaned];
      });
    } else {
      setSelectedAddons(prev => {
        const cleaned = prev.filter(k => !['notes_pdf', 'chart_diagrams', 'solved_questions', 'formula_sheet', 'concept_call'].includes(k));
        return cleaned.includes('code') ? cleaned : ['code', ...cleaned];
      });
    }
  }, [studentType]);

  // Pricing calculation result
  const [pricing, setPricing] = useState<{
    base_price: number;
    addons_breakdown: Record<string, number>;
    addons_total: number;
    urgency_fee: number;
    total: number;
    advance: number;
    balance: number;
  }>({
    base_price: 1500,
    addons_breakdown: {},
    addons_total: 0,
    urgency_fee: 0,
    total: 1500,
    advance: 450,
    balance: 1050,
  });

  // AI Scope Result
  const [aiScope, setAiScope] = useState<AiScopeData | null>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [orderCreatedId, setOrderCreatedId] = useState<number | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState<number>(0);
  const [couponMsg, setCouponMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [upiTrRef] = useState(() => 'CG' + Date.now().toString().slice(-9));
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [quota, setQuota] = useState<{ monthly_limit: number; used: number; remaining: number } | null>(null);

  useEffect(() => {
    if (step === 4) {
      api.get('/orders/user/payment-quota')
        .then(res => setQuota(res.data))
        .catch(() => {});
    }
  }, [step]);

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText('7020209079@ybl');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const effectiveTotal = appliedCoupon ? Math.round(pricing.total * (1 - couponDiscountPercent / 100)) : pricing.total;
  const effectiveAdvance = appliedCoupon ? Math.round(pricing.advance * (1 - couponDiscountPercent / 100)) : pricing.advance;
  const effectiveBalance = Math.max(0, effectiveTotal - effectiveAdvance);
  const totalDiscount = pricing.total - effectiveTotal;

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await api.post('/orders/validate-coupon', { code });
      setAppliedCoupon(res.data.code);
      setCouponDiscountPercent(res.data.discount_percent);
      setCouponMsg({
        text: res.data.message || `🎉 Coupon ${res.data.code} applied! ${res.data.discount_percent}% discount applied.`,
        type: 'success'
      });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponDiscountPercent(0);
      setCouponMsg({
        text: err.response?.data?.detail || "❌ Invalid or inactive coupon code.",
        type: 'error'
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscountPercent(0);
    setCouponCode('');
    setCouponMsg(null);
  };

  // Fetch dynamic price whenever inputs change
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const cat = studentType === 'school' ? 'school_assignment' : categoryKey;
        const res = await api.post('/orders/calculate-price', {
          category_key: cat,
          deliverables: selectedAddons,
          urgency: urgency,
          page_count: studentType === 'school' ? pageCount : null,
        });
        setPricing(res.data);
      } catch (err) {
        console.error('Pricing calculation failed', err);
      }
    };
    fetchPricing();
  }, [categoryKey, selectedAddons, urgency, studentType, pageCount]);

  const toggleAddon = (key: string) => {
    if (key === 'code' || key === 'notes_pdf') return; // Base deliverable is always mandatory & included
    setSelectedAddons(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Step 2 -> Step 3: Trigger AI Scope Generation
  const handleProceedToAiScope = async () => {
    if (!projectTitle.trim()) {
      alert('Please enter a project title or topic!');
      return;
    }
    setRefiningAi(true);
    setStep(3);

    const fallback = studentType === 'school'
      ? getSchoolFallbackScope(projectTitle, schoolClass, schoolSubject, pageCount)
      : getDomainFallbackScope(projectTitle, categoryKey);

    // Timeout safety fallback after 4 seconds
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 4000);
    });

    try {
      const selectedDomainObj = COLLEGE_DOMAINS.find(d => d.id === categoryKey);
      const apiPromise = api.post('/orders/refine-scope', {
        project_title: projectTitle,
        domain: studentType === 'college' ? (selectedDomainObj?.name || 'Computer Science') : schoolSubject,
        deliverables: selectedAddons,
        student_type: studentType,
        school_class: schoolClass,
        page_count: pageCount,
        notes: description,
      }, { timeout: 4000 });

      const raceResult = await Promise.race([apiPromise, timeoutPromise]);
      if (raceResult && (raceResult as any).data) {
        setAiScope((raceResult as any).data);
      } else {
        // Timed out after 4 seconds -> apply rich domain fallback immediately
        setAiScope(fallback);
      }
    } catch (e) {
      console.warn('AI scope refinement API call timed out or failed, using instant domain fallback:', e);
      setAiScope(fallback);
    } finally {
      setRefiningAi(false);
    }
  };

  // Step 3: Student customizes proposal using prompt
  const handlePromptRefinement = async () => {
    if (!customPrompt.trim()) return;
    setRefiningAi(true);
    const selectedDomainObj = COLLEGE_DOMAINS.find(d => d.id === categoryKey);
    try {
      const res = await api.post('/orders/refine-scope', {
        project_title: aiScope?.refined_title || projectTitle,
        domain: studentType === 'college' ? (selectedDomainObj?.name || 'Computer Science') : schoolSubject,
        deliverables: selectedAddons,
        student_type: studentType,
        school_class: schoolClass,
        page_count: pageCount,
        notes: `${description} - Student modification request: ${customPrompt}`,
      }, { timeout: 4500 });
      setAiScope(res.data);
      setCustomPrompt('');
    } catch (e) {
      console.warn('Prompt refinement timed out or failed:', e);
      // Append student improvement note to proposal
      if (aiScope) {
        setAiScope({
          ...aiScope,
          suggested_improvements: [...(aiScope.suggested_improvements || []), customPrompt],
        });
      }
      setCustomPrompt('');
    } finally {
      setRefiningAi(false);
    }
  };

  // Step 4: Submit Order and Pay 30% Advance
  const handleConfirmOrder = async () => {
    if (loading) return;
    const cleanUtr = utrNumber.trim();
    if (cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
      alert('Please enter a valid 12-digit numeric UPI UTR / Transaction Reference number from your payment receipt.');
      return;
    }
    setLoading(true);
    try {
      let currentOrderId = orderCreatedId;
      let currentOrderNumber = createdOrderNumber;

      if (!currentOrderId) {
        const res = await api.post('/orders', {
          category_key: studentType === 'school' ? 'school_assignment' : categoryKey,
          project_title: aiScope?.refined_title || projectTitle,
          description: description,
          domain: studentType === 'college' ? categoryKey : schoolSubject,
          deliverables: selectedAddons,
          page_count: studentType === 'school' ? pageCount : null,
          deadline: new Date(deadline).toISOString(),
          urgency: urgency,
          payment_method: paymentMethod,
          student_notes: `UTR: ${cleanUtr}. Coupon: ${appliedCoupon || 'None'}. Scope summary: ${aiScope?.methodology || ''}`,
          ai_refined_scope: JSON.stringify(aiScope),
        });

        const orderData = res.data;
        currentOrderId = orderData.id;
        currentOrderNumber = orderData.order_number;
        setOrderCreatedId(currentOrderId);
        setCreatedOrderNumber(currentOrderNumber);
      }

      // Confirm payment with UTR and Coupon
      await api.put(`/orders/${currentOrderId}/confirm-payment`, {
        payment_method: paymentMethod,
        utr_number: cleanUtr,
        coupon_code: appliedCoupon,
        discount_amount: totalDiscount,
      });

      setStep(5); // Success step
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to place order. Please check transaction details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const currentDomainExample = COLLEGE_DOMAINS.find(d => d.id === categoryKey)?.example;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Progress Bar Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                Step {step > 4 ? 4 : step} of 4
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {step === 1 && 'Choose Academic Stream & Domain'}
                {step === 2 && 'Customize Project Parameters'}
                {step === 3 && 'AI Scope Review & Prompt Refiner'}
                {step === 4 && 'Confirm Booking & 30% Advance Payment'}
                {step === 5 && 'Order Confirmed & Workspace Unlocked!'}
              </h1>
            </div>
            
            {/* Live Price Tag Pill */}
            {step < 5 && (
              <div className="hidden sm:flex flex-col items-end bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Estimated Total</span>
                <span className="text-xl font-black text-brand-600">₹{pricing.total}</span>
                <span className="text-[11px] text-emerald-600 font-semibold">30% Advance: ₹{pricing.advance}</span>
              </div>
            )}
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'bg-brand-600' : s < step ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Stream & Domain Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Stream Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setStudentType('college'); setCategoryKey('college_ml'); }}
                className={`p-6 rounded-2xl text-left border-2 transition-all ${
                  studentType === 'college'
                    ? 'border-brand-600 bg-white shadow-md ring-4 ring-brand-50'
                    : 'border-slate-200 bg-white/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🎓</span>
                  {studentType === 'college' && <CheckCircle2 className="w-6 h-6 text-brand-600" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900">College / Degree Student</h3>
                <p className="text-sm text-slate-500 mt-1">
                  B.Tech, BCA, MCA, Diploma, MSc. Full projects in ML, GenAI, Web, App, Data Science with source code & viva prep.
                </p>
              </button>

              <button
                type="button"
                onClick={() => { setStudentType('school'); setCategoryKey('school_assignment'); }}
                className={`p-6 rounded-2xl text-left border-2 transition-all ${
                  studentType === 'school'
                    ? 'border-accent-600 bg-white shadow-md ring-4 ring-accent-50'
                    : 'border-slate-200 bg-white/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🎒</span>
                  {studentType === 'school' && <CheckCircle2 className="w-6 h-6 text-accent-600" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900">School Student (Class 1 to 10th)</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Typed PDF assignments, science project documentation, creative chart papers & homework solutions at minimal cost.
                </p>
              </button>
            </div>

            {/* If College: Show Domain Grid */}
            {studentType === 'college' ? (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Select Project Domain
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {COLLEGE_DOMAINS.map(d => {
                    const Icon = d.icon;
                    const isSelected = categoryKey === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setCategoryKey(d.id)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-brand-600 bg-white shadow-md ring-2 ring-brand-100'
                            : 'border-slate-200 bg-white hover:border-brand-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-3">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* If School: Class and Subject Selector */
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900">School Level & Subject Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select Class / Standard</label>
                    <select
                      value={schoolClass}
                      onChange={e => setSchoolClass(e.target.value)}
                      className="input-field"
                    >
                      {SCHOOL_CLASSES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                    <select
                      value={schoolSubject}
                      onChange={e => setSchoolSubject(e.target.value)}
                      className="input-field"
                    >
                      {SCHOOL_SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Estimated Page Count: <span className="font-bold text-brand-600">{pageCount} Pages</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={pageCount}
                    onChange={e => setPageCount(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>5 Pages (₹250)</span>
                    <span>25 Pages (₹1,250)</span>
                    <span>50 Pages (₹2,500)</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
              >
                Continue to Customize <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Parameters & Deliverables with i.e. helpers */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              {/* Project Title with Guided Example */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">
                  {studentType === 'college' ? 'Project Title / Topic Name' : 'Assignment Topic'} *
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  placeholder={
                    studentType === 'college'
                      ? 'e.g., Crop Recommendation System using Soil NPK values'
                      : 'e.g., Solar System and Planetary Motion 10-page Assignment'
                  }
                  className="input-field text-base font-medium"
                />
                <p className="text-xs text-brand-600 font-medium mt-1.5 flex items-center gap-1">
                  <span>💡</span>
                  <span>
                    {studentType === 'college'
                      ? currentDomainExample
                      : 'i.e., "Solar System Model report with colored illustrations and question answers"'}
                  </span>
                </p>
              </div>

              {/* Requirements Description with Guided Example */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">
                  Key Requirements & Specific Features
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={
                    studentType === 'college'
                      ? 'i.e., "User enters Nitrogen, Phosphorus, Potassium values. System uses Random Forest classifier to recommend the best crop. I want an interactive web UI with charts and high accuracy."'
                      : 'i.e., "Include 8 planets with their distance from sun, neat diagram sketches, typed font, and 5 quiz questions at the end."'
                  }
                  className="input-field text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Describe what you need — our AI will turn this into a professional project specification next!
                </p>
              </div>

              {/* Deadline & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Submission Deadline *
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setDeadline(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Speed</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setUrgency('normal')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                        urgency === 'normal'
                          ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Normal<br />
                      <span className="text-[10px] text-slate-400 font-normal">
                        {studentType === 'school' ? '3-5 Days' : '5-7 Days'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('express')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                        urgency === 'express'
                          ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {studentType === 'school' ? 'Express (+₹150)' : 'Express (+₹600)'}<br />
                      <span className="text-[10px] text-amber-600 font-normal">
                        {studentType === 'school' ? '24-48 Hours' : '48 Hours'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('super_express')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                        urgency === 'super_express'
                          ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {studentType === 'school' ? 'Super (+₹300)' : 'Super (+₹900)'}<br />
                      <span className="text-[10px] text-rose-600 font-normal">24 Hours</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Add-on Deliverables with Dynamic Pricing */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  Select Deliverables & Add-ons (Check all that apply)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(studentType === 'school' ? SCHOOL_ADDONS : COLLEGE_ADDONS).map(addon => {
                    if (addon.isIncluded) {
                      return (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-slate-800">{addon.name}</span>
                              <p className="text-[11px] text-slate-500">{addon.desc}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded shrink-0">
                            Included
                          </span>
                        </div>
                      );
                    }

                    const isChecked = selectedAddons.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'border-brand-600 bg-brand-50/60 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-brand-600 accent-brand-600 shrink-0"
                          />
                          <div>
                            <span className="text-sm font-bold text-slate-800">{addon.name}</span>
                            <p className="text-[11px] text-slate-500">{addon.desc}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-brand-600 bg-white px-2 py-0.5 rounded border border-brand-200 shrink-0">
                          {addon.priceLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              
              <button
                type="button"
                onClick={handleProceedToAiScope}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base shadow-lg shadow-brand-500/20"
              >
                <Sparkles className="w-5 h-5" /> Generate AI Scope Proposal <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AI Scope Proposal & Interactive Prompt Customizer */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            {refiningAi ? (
              <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 text-center space-y-5 shadow-sm max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-spin shadow-inner">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Synthesizing Project Scope with AI...</h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Analyzing domain architecture, tech stack compatibility, and assembling your IEEE specification.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fb = studentType === 'school'
                        ? getSchoolFallbackScope(projectTitle, schoolClass, schoolSubject, pageCount)
                        : getDomainFallbackScope(projectTitle, categoryKey);
                      setAiScope(fb);
                      setRefiningAi(false);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    ⚡ Skip Waiting & Review Scope Immediately →
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Cols: AI Generated Proposal */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg w-fit">
                      <Sparkles className="w-4 h-4" /> {studentType === 'school' ? `🎒 AI Academic Syllabus Plan (${schoolClass} • ${schoolSubject})` : 'AI Generated Project Proposal'}
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {aiScope?.refined_title || projectTitle}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Timeline: <span className="font-semibold text-slate-800">{aiScope?.timeline_days || (studentType === 'school' ? 3 : 5)} Days</span> • {studentType === 'school' ? 'Curriculum' : 'Methodology'}: {aiScope?.methodology || (studentType === 'school' ? 'NCERT & Board Aligned Proofs Layout' : 'Agile Sprints')}
                      </p>
                    </div>

                    {/* Tech Stack or Syllabus Topics */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {studentType === 'school' ? '📐 Key Syllabus Chapters & Academic Concepts' : 'Planned Technology Stack'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(aiScope?.tech_stack || (
                          studentType === 'school'
                            ? ['Basic Proportionality Theorem (Thales)', 'Similarity Criteria (AAA, SSS, SAS)', 'NCERT Exemplar Problems']
                            : ['Python', 'FastAPI', 'React', 'Tailwind']
                        )).map((tech, idx) => (
                          <span
                            key={idx}
                            className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                              studentType === 'school'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Deliverables Checklist */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {studentType === 'school' ? `📚 Guaranteed Academic Deliverables (${pageCount} Pages)` : 'Guaranteed Deliverables'}
                      </h4>
                      <ul className="space-y-2">
                        {(aiScope?.deliverables_detail || (
                          studentType === 'school'
                            ? [
                                `${pageCount}-Page High-Yield Structured Notes (Printable PDF)`,
                                'Neat Geometric Diagrams & Figure Illustrations with Clear Labels',
                                '15+ Solved Board Exemplar Problems with Step-by-Step Reasons',
                                'Formula Cheat Sheet & Quick-Revision Theorem Card'
                              ]
                            : [
                                'Complete working source code',
                                'README execution and setup guide',
                              ]
                        )).map((deliv, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{deliv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggested Improvements */}
                    {aiScope?.suggested_improvements && aiScope.suggested_improvements.length > 0 && (
                      <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs space-y-1.5">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" /> {studentType === 'school' ? '🎯 Exam-Ready Mentor & Syllabus Recommendations:' : 'Mentor Enhancement Recommendations:'}
                        </span>
                        {aiScope.suggested_improvements.map((imp, idx) => (
                          <p key={idx} className="text-amber-800 pl-5">• {imp}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Prompt Box for Scope Customization */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <label className="block text-xs font-bold text-slate-900">
                      {studentType === 'school'
                        ? 'Want to add specific theorems, exemplar questions, or diagram formats? Tell the AI:'
                        : 'Want to modify or add anything? Tell the AI:'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        placeholder={
                          studentType === 'school'
                            ? 'e.g., "Add 5 NCERT exemplar questions with steps, or focus more on converse of BPT theorem"'
                            : 'e.g., "Add dark mode UI and include random forest evaluation metrics"'
                        }
                        className="input-field text-sm"
                        onKeyDown={e => e.key === 'Enter' && handlePromptRefinement()}
                      />
                      <button
                        type="button"
                        onClick={handlePromptRefinement}
                        disabled={refiningAi || !customPrompt.trim()}
                        className="btn-secondary text-xs flex items-center gap-1.5 shrink-0 px-4"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Update Scope
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Pricing Summary Card */}
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-6">
                    <h3 className="font-bold text-slate-900 text-base">Cost & Payment Breakdown</h3>
                    
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>{studentType === 'school' ? `School Assignment (${pageCount} Pages)` : 'Base College Project'}</span>
                        <span className="font-semibold text-slate-900">₹{pricing.base_price}</span>
                      </div>

                      {Object.entries(pricing.addons_breakdown).map(([k, amt]) => {
                        const addonObj = [...SCHOOL_ADDONS, ...COLLEGE_ADDONS].find(a => a.id === k);
                        return (
                          <div key={k} className="flex justify-between text-slate-600 text-xs">
                            <span className="truncate max-w-[200px]">{addonObj ? addonObj.name : k.replace('_', ' ')}</span>
                            <span className="font-semibold text-slate-900 shrink-0">+₹{amt}</span>
                          </div>
                        );
                      })}

                      {pricing.urgency_fee > 0 && (
                        <div className="flex justify-between text-amber-600 text-xs">
                          <span>Urgency Fee ({urgency})</span>
                          <span className="font-semibold">+₹{pricing.urgency_fee}</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-base">
                        <span>Total Project Cost</span>
                        <span className="text-brand-600 text-lg">₹{pricing.total}</span>
                      </div>
                    </div>

                    {/* 30% - 70% Milestone Callout */}
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-900">Pay Now (30% Advance):</span>
                        <span className="text-base font-black text-emerald-700">₹{pricing.advance}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-emerald-800">
                        <span>Pay on Completion (70%):</span>
                        <span className="font-semibold">₹{pricing.balance}</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 pt-1 border-t border-emerald-200/60">
                        🛡️ 100% Secure. Balance is paid only after you inspect the project demo/screenshots.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="w-full btn-primary py-3.5 text-center font-bold text-sm shadow-md shadow-brand-500/20"
                    >
                      Accept Scope & Proceed to Pay 30%
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
                    >
                      ← Back to edit parameters
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* STEP 4: 30% Advance Payment & Confirmation */}
        {step === 4 && (
          <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                Final Step
              </span>
              <h2 className="text-2xl font-black text-slate-900">30% Advance Booking Payment</h2>
              <p className="text-xs text-slate-500">
                Lock your project slot with your dedicated mentor.
              </p>
            </div>

            {/* Amount Callout */}
            <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-6 rounded-2xl text-white text-center shadow-lg shadow-brand-500/25">
              <span className="text-xs text-brand-200 uppercase tracking-widest font-bold">Advance Amount Due (30%)</span>
              <div className="flex items-center justify-center gap-2 mt-1">
                {appliedCoupon && (
                  <span className="text-xl line-through text-brand-300 font-bold">₹{pricing.advance}</span>
                )}
                <div className="text-4xl font-black">₹{effectiveAdvance}</div>
              </div>
              <span className="text-xs text-brand-200 mt-1 block">
                Total Project: {appliedCoupon ? <><span className="line-through">₹{pricing.total}</span> <strong className="text-white">₹{effectiveTotal}</strong></> : `₹${pricing.total}`} • Balance ₹{effectiveBalance} on delivery
              </span>
              {appliedCoupon && (
                <span className="inline-block mt-2 bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 text-[11px] font-bold px-3 py-1 rounded-full">
                  🎉 Coupon {appliedCoupon} Active: {couponDiscountPercent}% Off (-₹{totalDiscount})
                </span>
              )}
            </div>

            {/* Coupon Code Section */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" /> Have a Promo Coupon?
                </span>
                {appliedCoupon && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {couponDiscountPercent}% OFF APPLIED
                  </span>
                )}
              </div>

              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                    placeholder="Enter promo coupon code"
                    className="flex-1 input-field text-xs font-mono uppercase bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="btn-primary text-xs px-4 py-2 font-bold shrink-0 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200">
                  <div className="text-xs">
                    <span className="font-mono font-black text-emerald-700">{appliedCoupon}</span>
                    <span className="text-slate-600 ml-2 font-medium">(-₹{totalDiscount} / {couponDiscountPercent}% discount applied)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponMsg ? (
                <p className={`text-[11px] font-semibold ${couponMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {couponMsg.text}
                </p>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Optional: Enter your discount coupon code above.
                </p>
              )}
            </div>

            {/* UPI Payment Instructions */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-brand-600" /> Instant Direct UPI QR Payment
                </span>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  GPay / PhonePe / Paytm / BHIM
                </span>
              </div>

              {/* QR Box */}
              <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`upi://pay?pa=7020209079@ybl&pn=Dattatray%20Goraksh%20Hadke&am=${effectiveAdvance}&cu=INR&tn=${encodeURIComponent('CampusGig Advance ' + (projectTitle.slice(0, 15) || 'Order'))}&tr=${upiTrRef}`)}`}
                    alt="Direct UPI QR"
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                </div>
                <div className="mt-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Verified Merchant Payee
                  </span>
                  <span className="text-xs font-black text-slate-900 block">
                    DATTATRAY GORAKSH HADKE
                  </span>
                  <div className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                    <span className="text-xs font-mono font-bold text-slate-800">7020209079@ybl</span>
                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="text-slate-500 hover:text-blue-600 transition-colors p-0.5"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <a
                      href={`upi://pay?pa=7020209079@ybl&pn=Dattatray%20Goraksh%20Hadke&am=${effectiveAdvance}&cu=INR&tn=${encodeURIComponent('CampusGig Advance ' + (projectTitle.slice(0, 15) || 'Order'))}&tr=${upiTrRef}`}
                      className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-bold shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Pay via UPI App
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="btn-secondary text-xs px-3 py-1.5 font-bold rounded-xl flex items-center gap-1"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedUpi ? 'Copied UPI ID' : 'Copy UPI ID'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Submissions Quota Tracker */}
              {quota && (
                <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Monthly Submissions:</span>
                  <span className={`font-bold ${quota.remaining > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {quota.used} / {quota.monthly_limit} used ({quota.remaining} remaining this month)
                  </span>
                </div>
              )}

              {/* UTR Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-900">
                    Enter 12-Digit UPI UTR / Bank Reference Number *
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${utrNumber.length === 12 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {utrNumber.length}/12 Digits
                  </span>
                </div>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={e => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="e.g., 412356789012"
                  maxLength={12}
                  disabled={Boolean(quota && quota.remaining <= 0)}
                  className="input-field font-mono text-sm tracking-wider"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Copy 12-digit UTR from your UPI payment success screen (GPay, PhonePe, Paytm).
                </p>
                {quota && quota.remaining <= 0 && (
                  <p className="text-[11px] text-red-600 font-bold mt-1.5">
                    ⚠️ Monthly submission limit reached (3/3 used). Please contact admin for manual verification.
                  </p>
                )}
                <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-1.5 text-[10px] text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Anti-Cheat Security:</strong> Every submitted UTR is matched against bank statements. Fake or duplicate UTR submissions are rejected and access is blocked.
                  </span>
                </div>
              </div>
            </div>

            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setUtrNumber(`${Date.now()}`.slice(-12));
                }}
                className="w-full py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold rounded-xl border border-purple-300 flex items-center justify-center gap-1.5 transition-all"
              >
                <Zap className="w-4 h-4 text-purple-600" /> Admin Fast-Fill 12-Digit Demo UTR
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={loading || !utrNumber.trim() || Boolean(quota && quota.remaining <= 0)}
              className="w-full btn-primary py-4 text-base font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Verifying & Booking...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Submit & Start Project Workspace
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
            >
              ← Back to Scope
            </button>
          </div>
        )}

        {/* STEP 5: Success & Direct Chat CTA */}
        {step === 5 && (
          <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-6 animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Booking Confirmed!
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                Your Project Workspace is Live
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Order Reference: <span className="font-mono font-bold text-slate-800">{createdOrderNumber}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Advance Paid:</span>
                <span className="font-bold text-emerald-600">₹{pricing.advance} (30%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Balance Pending:</span>
                <span className="font-bold text-slate-800">₹{pricing.balance} (70% on completion)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Live Mentor Status:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online & Available
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/chat/${orderCreatedId}`)}
              className="w-full btn-primary py-4 text-base font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" /> Open Direct Chat with Mentor
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Go to Student Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderWizard;
