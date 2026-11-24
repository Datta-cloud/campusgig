import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, ArrowRight, BookOpen, Calculator, GraduationCap, ChevronDown } from 'lucide-react';
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

export const AcademicChatbot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `👋 Hi ${user?.full_name || 'there'}! I am your **CampusGig Academic AI Assistant**.\n\nI can help you with:\n• 📚 **CBSE & ICSE Syllabus** (e.g., Class 10th Math Triangles, Science)\n• 💰 **Dynamic Price Breakdown** (Base rates + add-ons)\n• 🎓 **College Final Year Projects** (ML, GenAI, Web, Android)\n• ⚡ **Milestone Delivery & Defense Support**\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call Academic Assistant endpoint (supports /api/ai/academic-assistant and /api/orders/ai/academic-assistant)
      const res = await api.post('/ai/academic-assistant', {
        message: query,
        student_type: user?.student_type || 'college',
        context: `User is a ${user?.student_type || 'student'}${user?.school_class ? ` in ${user.school_class}` : ''}.`
      }).catch(async () => {
        // Fallback endpoint if route alias differs
        return await api.post('/orders/ai/academic-assistant', {
          message: query,
          student_type: user?.student_type || 'college',
        });
      });

      const replyText = res.data?.reply || res.data?.response || "I've reviewed your academic request! Please check our Project Wizard for instant syllabus plan customization.";

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
      let fallbackText = "I'm having trouble connecting to the AI brain right now. For Class 10 Mathematics (Triangles & Similarity), our system covers Chapter 6: Thales Theorem (BPT), Converse of BPT, Similarity Criteria (AAA, SSS, SAS), Area Ratios, and Pythagoras Theorem connections with 15+ solved questions!";
      if (query.toLowerCase().includes('price') || query.toLowerCase().includes('cost')) {
        fallbackText = "💰 **Pricing Structure:**\n• **School Students:** ₹50 per page (min 10 pages) + optional add-ons (diagrams ₹150, solved proofs ₹100, formula sheet ₹100).\n• **College Students:** Machine Learning starting from ₹1,500 with full working code, setup guide, and documentation.";
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
                <p className="text-[11px] text-indigo-100 font-medium">Syllabus • Pricing • Project Scope</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/20 transition-all text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
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
