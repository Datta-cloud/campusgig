import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, ArrowRight, BookOpen, Calculator, GraduationCap, ChevronDown, RotateCcw, Cloud } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const STARTER_QUESTIONS = [
  { label: '📐 Class 10 Math Similarity', query: 'What is in the Class 10 Mathematics syllabus for Triangles and Similarity?' },
  { label: '💰 Dynamic Pricing Formula', query: 'How does CampusGig calculate pricing dynamically for school and college projects?' },
  { label: '🎒 School Notes Deliverables', query: 'What deliverables are included with School assignments?' },
  { label: '🤖 College ML Project Ideas', query: 'What are popular Final Year ML and GenAI capstone project topics?' },
];

const CHAT_STORAGE_KEY = 'campusgig_academic_chat_history';

const getOrCreateSessionId = (): string => {
  try {
    let sid = localStorage.getItem('campusgig_chat_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('campusgig_chat_session_id', sid);
    }
    return sid;
  } catch (e) {
    return 'sid_default_' + Date.now();
  }
};

export const AcademicChatbot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const sessionId = useRef<string>(getOrCreateSessionId());

  const getInitialMessages = (): ChatMessage[] => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse chat history:", e);
    }
    return [
      {
        id: 'welcome',
        sender: 'assistant',
        text: `👋 Hi ${user?.full_name || 'there'}! I am your **CampusGig Academic AI Assistant** (supported by Lead Mentor **Datta Hadke**).\n\nI can help you with:\n• 📚 **CBSE & ICSE Syllabus** (e.g., Class 10th Math Triangles & Similarity, Science)\n• 💰 **Dynamic Price Calculations** (Transparent rates + 30% advance)\n• 🎓 **College Final Year Projects** (ML, GenAI, Web, Android)\n• ⚡ **Direct 1-on-1 Guidance with Founder Datta Hadke**\n\nHow can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);

  // Sync with cloud database on load or user change
  useEffect(() => {
    let isMounted = true;
    const loadCloudHistory = async () => {
      try {
        const res = await api.get('/ai/academic-assistant/history', {
          params: { session_id: sessionId.current }
        });
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          const cloudMessages: ChatMessage[] = res.data.map((m: any) => ({
            id: m.id || `cloud-${Date.now()}-${Math.random()}`,
            sender: m.sender === 'user' ? 'user' : 'assistant',
            text: m.text,
            timestamp: m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(cloudMessages);
          setCloudSynced(true);
          try {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cloudMessages));
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Could not sync cloud history, using local cache:", err);
      }
    };

    loadCloudHistory();
    return () => { isMounted = false; };
  }, [user]);

  // Sync chat history to localStorage as local cache
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
      }
    } catch (e) {
      console.warn("Failed to persist chat history:", e);
    }
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleClearChat = async () => {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      await api.delete('/ai/academic-assistant/history', {
        params: { session_id: sessionId.current }
      }).catch(() => {});
    } catch (e) {}

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `🧹 **Chat history cleared from cloud & local storage!**\n\nHi ${user?.full_name || 'there'}, feel free to ask about syllabus topics, project guidelines, or dynamic pricing.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInput('');
    setLoading(true);

    // Prepare multi-turn history for backend context
    const historyPayload = messages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text
    }));

    try {
      // Call Academic Assistant endpoint with session_id & history to persist in cloud DB
      const res = await api.post('/ai/academic-assistant', {
        message: query,
        session_id: sessionId.current,
        history: historyPayload,
        student_type: user?.student_type || 'college',
        context: {
          student_name: user?.full_name || 'Student',
          student_type: user?.student_type || 'college',
          school_class: user?.school_class || undefined,
          lead_mentor: "Datta Hadke"
        }
      }).catch(async () => {
        // Fallback endpoint if route alias differs
        return await api.post('/orders/ai/academic-assistant', {
          message: query,
          session_id: sessionId.current,
          history: historyPayload,
          student_type: user?.student_type || 'college',
        });
      });

      const replyText = res.data?.reply || res.data?.response || "I've reviewed your academic request! Please check our Project Wizard for instant syllabus plan customization.";
      setCloudSynced(true);

      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      // Graceful offline fallback
      let fallbackText = "I'm here to help! For Class 10 Mathematics (Triangles & Similarity), our notes cover Chapter 6: Thales Theorem (BPT), Converse of BPT, Similarity Criteria (AAA, SSS, SAS), Area Ratios, and Pythagoras Theorem connections with 15+ solved questions!";
      if (query.toLowerCase().includes('price') || query.toLowerCase().includes('cost')) {
        fallbackText = "💰 **Pricing Structure:**\n• **School Students:** ₹50 per page (min 10 pages) + optional add-ons (diagrams ₹150, solved proofs ₹100, formula sheet ₹100).\n• **College Students:** Machine Learning starting from ₹1,500 with full working code, setup guide, and documentation.";
      } else if (query.toLowerCase().includes('which ai') || query.toLowerCase().includes('who are you')) {
        fallbackText = "🤖 I am **CampusGig Academic AI Assistant**, powered by Google Gemini! I work directly with our founder and lead mentor **Datta Hadke** to guide students on assignments, code, and viva defense.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white px-3.5 py-2 rounded-full shadow-lg border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer hover:border-brand-300 hover:shadow-xl transition-all animate-bounce"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Need Syllabus or Project Help?</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 ${
            isOpen
              ? 'bg-slate-800 text-white rotate-90 scale-95'
              : 'bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-brand-500/30 ring-4 ring-brand-100'
          }`}
          title="CampusGig AI Academic Assistant"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
          {!isOpen && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          )}
        </button>
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <GraduationCap className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  Academic AI Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-100 font-medium">
                  <span>Syllabus • Pricing • Scope</span>
                  <span className="text-white/30">•</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-200 font-bold bg-white/10 px-1.5 py-0.5 rounded-md backdrop-blur-xs" title="Chat messages are persisted in cloud database">
                    <Cloud className="w-2.5 h-2.5 text-emerald-300" />
                    <span>Cloud Synced</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-xl hover:bg-white/20 transition-all text-white/80 hover:text-white"
                title="Clear chat history"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 transition-all text-white/80 hover:text-white"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {STARTER_QUESTIONS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.query)}
                className="whitespace-nowrap text-[11px] font-semibold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs transition-all shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-slate-50/50 to-white text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-line font-medium text-xs">
                    {msg.text}
                  </div>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex gap-1 py-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about 10th Math, pricing, code..."
              className="flex-1 input-field text-xs py-2 px-3 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold transition-all shadow-sm"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};

export default AcademicChatbot;
