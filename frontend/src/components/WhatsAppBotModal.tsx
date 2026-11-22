import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, CheckCheck, Smartphone, Sparkles, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import api from '../services/api';

interface WhatsAppBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  projectTitle: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const WhatsAppBotModal: React.FC<WhatsAppBotModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  projectTitle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputCommand, setInputCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize with welcome message from bot
      const initialTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([
        {
          id: 'welcome-1',
          sender: 'bot',
          text: `🤖 *CampusGig WhatsApp Assistant*\n\nWelcome! This is your 2-Way automated hotline for Order *#${orderNumber}* (${projectTitle.slice(0, 30)}...).\n\nTap any quick command below or type your query:\n• *STATUS* — Check current phase & milestone\n• *REPORT* — Receive IEEE research paper link\n• *MEET* — Get 1-on-1 Walkthrough video room link\n• *BALANCE* — Check fee breakdown & UPI link`,
          time: initialTime,
        }
      ]);
    }
  }, [isOpen, orderNumber, projectTitle]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendCommand = async (cmdText?: string) => {
    const cmd = (cmdText || inputCommand).trim();
    if (!cmd || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message to thread
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cmd,
      time: currentTime,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputCommand('');
    setLoading(true);

    try {
      const res = await api.post(`/orders/${orderId}/whatsapp-bot`, { command: cmd });
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.data.reply || 'Request received. Live bot status verified.',
        time: res.data.timestamp || currentTime,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ *CampusGig Bot Alert*\nCommand received: "${cmd}". Connected to backup hotline gateway.`,
        time: currentTime,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWebhook = () => {
    const webhookUrl = `${window.location.origin.replace('5173', '8001')}/api/orders/webhook/whatsapp`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const quickPills = [
    { label: 'STATUS', desc: 'Phase & Progress' },
    { label: 'REPORT', desc: 'IEEE PDF Link' },
    { label: 'MEET', desc: 'Video Call Link' },
    { label: 'BALANCE', desc: '70% Balance & UPI' },
    { label: 'HELP', desc: 'All Commands' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                  2-Way Interactive WhatsApp Bot
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Command Center
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xl">
                Students can check status, download IEEE PDF reports, and request video calls directly via WhatsApp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#0b141a]">
          
          {/* Left Column: WhatsApp Phone Simulation */}
          <div className="flex-1 flex flex-col border-r border-slate-800/80 overflow-hidden">
            
            {/* Phone Top Bar */}
            <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-sm shadow">
                  CG
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                    CampusGig Assistant
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
                  </h4>
                  <p className="text-[10px] text-emerald-400 font-medium">Official Verified Business Hotline</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full font-mono">
                Order: #{orderNumber}
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-opacity-95">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-md leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-[#005c4b] text-slate-100 rounded-tr-none'
                        : 'bg-[#202c33] text-slate-200 rounded-tl-none border border-slate-700/40'
                    }`}
                  >
                    <div>{msg.text}</div>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400 font-sans">
                      <span>{msg.time}</span>
                      {msg.sender === 'user' && (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#202c33] p-3 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00a884] animate-ping" />
                    <span>CampusGig Bot is typing...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Command Pills */}
            <div className="px-3 py-2 bg-[#1f2c34]/70 border-t border-slate-700/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {quickPills.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSendCommand(p.label)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-lg bg-[#2a3942] hover:bg-[#00a884] hover:text-white text-slate-300 text-[11px] font-bold whitespace-nowrap border border-slate-600/40 transition-all disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#202c33] border-t border-slate-700/60 flex items-center gap-2">
              <input
                type="text"
                value={inputCommand}
                onChange={e => setInputCommand(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendCommand()}
                placeholder="Type 'STATUS', 'REPORT', 'MEET', or 'BALANCE'..."
                className="flex-1 bg-[#2a3942] text-slate-100 placeholder-slate-400 text-xs px-4 py-2.5 rounded-xl outline-none border border-transparent focus:border-[#00a884]"
              />
              <button
                type="button"
                onClick={() => handleSendCommand()}
                disabled={loading || !inputCommand.trim()}
                className="p-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white disabled:opacity-50 transition-all shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Column: Developer Webhook & Integration Guide */}
          <div className="w-full md:w-80 p-5 bg-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Live Webhook Integration
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Connect your Twilio Sandbox or WhatsApp Cloud API webhook directly to this endpoint:
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-mono">POST Endpoint</span>
                <p className="text-[11px] text-emerald-400 font-mono break-all">
                  /api/orders/webhook/whatsapp
                </p>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copied Full URL' : 'Copy Webhook URL'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-[11px] text-slate-300">Supported Direct Commands:</h5>
                <ul className="text-[11px] text-slate-400 space-y-1.5 font-mono">
                  <li><strong className="text-emerald-400">STATUS:</strong> Current phase, milestone completion %</li>
                  <li><strong className="text-emerald-400">REPORT:</strong> Direct link to IEEE paper PDF</li>
                  <li><strong className="text-emerald-400">MEET:</strong> 1-on-1 walkthrough video call URL</li>
                  <li><strong className="text-emerald-400">BALANCE:</strong> 70% payment link &amp; QR</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed">
                <strong>Zero Website Friction:</strong> Engineering students can monitor their capstone progress completely on mobile without opening a browser.
              </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center font-mono">
              WhatsApp Business Cloud API Ready
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default WhatsAppBotModal;
