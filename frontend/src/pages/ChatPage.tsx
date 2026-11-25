import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Send, Paperclip, Clock, CheckCheck, User as UserIcon, Shield,
  ArrowLeft, Download, RefreshCw, CheckCircle2, AlertCircle, FileText, ShieldCheck,
  Mic, Square, Volume2, StopCircle
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, Order } from '../types';
import StatusBadge from '../components/StatusBadge';
import OnlineIndicator from '../components/OnlineIndicator';
import { formatISTTime } from '../utils/date';
import { PaymentModal } from '../components/PaymentModal';

export const ChatPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mentorOnline, setMentorOnline] = useState(true);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<'advance' | 'balance'>('balance');

  // WhatsApp-Style Voice Memo Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('Microphone access denied or not available: ' + err.message);
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const file = new File([audioBlob], `voicenote_${Date.now()}.webm`, { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('order_id', orderId || '');

      setSending(true);
      try {
        const res = await api.post(`/chat/upload-attachment?order_id=${orderId}`, formData);
        setMessages(prev => [...prev, res.data]);
        scrollToBottom();
      } catch (err: any) {
        alert(getErrorMessage(err, 'Failed to send voice memo'));
      } finally {
        setSending(false);
        setIsRecording(false);
        setRecordingTime(0);
      }
    };

    mediaRecorderRef.current.stop();
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Order Details and Messages
  const fetchData = async () => {
    if (!orderId) return;
    try {
      const [orderRes, msgRes] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get(`/chat/messages/${orderId}`)
      ]);
      setOrder(orderRes.data);
      setMessages(msgRes.data);
    } catch (err) {
      console.error('Failed to load chat data', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all orders for left sidebar
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = user?.role === 'admin' ? await api.get('/orders') : await api.get('/orders/my');
        const list = Array.isArray(res.data) ? res.data : (res.data.orders || []);
        setAllOrders(list);

        // Auto-select first order if none selected
        if (!orderId && list.length > 0) {
          const target = user?.role === 'admin' ? `/admin/chat/${list[0].id}` : `/chat/${list[0].id}`;
          navigate(target, { replace: true });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchOrders();
  }, [user, orderId]);

  // Initial load + Polling interval (every 3 seconds for real-time responsiveness)
  useEffect(() => {
    if (orderId) {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !orderId) return;

    setSending(true);
    try {
      const res = await api.post('/chat/messages', {
        order_id: Number(orderId),
        content: newMessage.trim(),
        message_type: 'text'
      });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('order_id', orderId);

    try {
      setSending(true);
      const res = await api.post(`/chat/upload-attachment?order_id=${orderId}`, formData);
      setMessages(prev => [...prev, res.data]);
      scrollToBottom();
    } catch (err: any) {
      alert(getErrorMessage(err, 'File upload failed. Ensure file is within 500MB limit.'));
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-slate-100 flex overflow-hidden">
      
      {/* Left Sidebar: Orders Navigation */}
      <div className="hidden md:flex w-80 bg-white border-r border-slate-200 flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-800">Direct Chat Workspaces</h2>
          <p className="text-xs text-slate-500">Your projects & active communication</p>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {allOrders.map(o => {
            const isCurrent = o.id === Number(orderId);
            return (
              <Link
                key={o.id}
                to={user?.role === 'admin' ? `/admin/chat/${o.id}` : `/chat/${o.id}`}
                className={`p-3.5 block transition-all ${
                  isCurrent ? 'bg-brand-50/70 border-l-4 border-brand-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono font-bold text-slate-500">{o.order_number}</span>
                  <StatusBadge status={o.status} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate">{o.project_title}</h4>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span className="capitalize">{o.domain || o.category_key}</span>
                  <span>Total: ₹{o.total_price}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Chat Pane */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        
        {/* Chat Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="md:hidden text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
              {user?.role === 'admin' ? (
                order?.student?.full_name?.charAt(0) || 'S'
              ) : (
                <Shield className="w-5 h-5 text-brand-600" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  {user?.role === 'admin'
                    ? `${order?.student?.full_name || 'Student'} (${order?.student?.college_name || order?.student_type})`
                    : 'CampusGig Chief Mentor'}
                </h3>
                
                {/* Online Badge */}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online & Active
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">
                {order?.order_number} • {order?.project_title}
              </p>
            </div>
          </div>

          {/* Right Header: Order Info & Status */}
          {order && (
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Milestone Status</span>
                <span className="text-xs font-bold text-slate-800">
                  {order.status === 'advance_paid' && '30% Advance Paid • Development In Progress'}
                  {order.status === 'in_progress' && 'Code & Deliverables Being Built'}
                  {order.status === 'ready_for_review' && 'Ready for Review • Balance Pending'}
                  {order.status === 'completed' && 'Delivered & Completed (100% Paid)'}
                  {order.status === 'pending_payment' && 'Pending Advance Payment'}
                  {order.status === 'revision_requested' && 'Revision Requested'}
                </span>
              </div>
              <StatusBadge status={order.status} />

              {user?.role === 'student' && order.status === 'ready_for_review' && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentModalType('balance');
                    setShowPaymentModal(true);
                  }}
                  className="btn-accent text-xs px-3.5 py-1.5 font-bold shadow-sm flex items-center gap-1.5 animate-pulse"
                >
                  <ShieldCheck className="w-4 h-4" /> Pay Balance (₹{order.balance_amount})
                </button>
              )}

              <Link
                to={`/order/${order.id}`}
                className="btn-secondary text-xs px-3 py-1.5 font-bold"
              >
                Order View
              </Link>
            </div>
          )}
        </div>

        {/* Milestone Progress Strip */}
        {order && (
          <div className={`border-b px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-medium ${
            order.status === 'ready_for_review'
              ? 'bg-purple-50/90 border-purple-200 text-purple-950'
              : order.status === 'completed'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : order.status === 'revision_requested'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-gradient-to-r from-brand-50 to-indigo-50 border-brand-100 text-brand-900'
          }`}>
            <div className="flex items-center gap-2">
              {order.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : order.status === 'ready_for_review' ? (
                <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 animate-bounce" />
              ) : order.status === 'revision_requested' ? (
                <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
              )}
              <span>
                {order.status === 'ready_for_review' ? (
                  <>
                    <strong className="text-purple-700">📦 Deliverables Ready for Review!</strong> Total: ₹{order.total_price} | Advance Paid: ₹{order.advance_amount}.
                  </>
                ) : order.status === 'completed' ? (
                  <>
                    <strong>100% Completed &amp; Fully Paid!</strong> Clean deliverables unlocked.
                  </>
                ) : order.status === 'revision_requested' ? (
                  <>
                    <strong>Revision in progress.</strong> Mentor is reviewing requested updates.
                  </>
                ) : (
                  <>
                    <strong>30% Advance (₹{order.advance_amount}) Received.</strong> Full source code, report &amp; PPT being prepared.
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {order.status !== 'completed' && order.balance_amount > 0 && (
                <span className="text-slate-700">
                  Remaining 70% Balance: <strong className="text-brand-600">₹{order.balance_amount}</strong>
                </span>
              )}

              {user?.role === 'student' && order.status === 'ready_for_review' && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentModalType('balance');
                    setShowPaymentModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Pay Remaining Fee (₹{order.balance_amount})
                </button>
              )}

              {user?.role === 'student' && order.status === 'pending_payment' && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentModalType('advance');
                    setShowPaymentModal(true);
                  }}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  Pay 30% Advance (₹{order.advance_amount})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Welcome Announcement Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto shadow-sm space-y-2">
            <span className="text-2xl">👋</span>
            <h4 className="font-bold text-slate-900 text-sm">Dedicated Project Workspace</h4>
            <p className="text-xs text-slate-500">
              Welcome to your private 1-on-1 direct channel. Ask questions, share requirements, or request progress screenshots anytime!
            </p>
          </div>

          {messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const isAdminMessage = msg.sender?.role === 'admin' || (!msg.sender && isMe && user?.role === 'admin');

            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                    isAdminMessage
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isAdminMessage ? 'M' : msg.sender?.full_name?.charAt(0) || 'S'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-600">
                      {isMe ? 'You' : msg.sender?.full_name || (isAdminMessage ? 'Mentor' : 'Student')}
                    </span>
                    <span>{formatISTTime(msg.created_at)}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.content}

                    {/* Audio Voice Memo Player */}
                    {msg.message_type === 'audio' || (msg.file_url && msg.file_url.match(/\.(webm|mp3|wav|ogg|m4a)$/i)) ? (
                      <div className="mt-2.5 pt-2 border-t border-white/20">
                        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold">
                          <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                          <span>Voice Memo Recording</span>
                        </div>
                        <audio controls className="w-full max-w-xs h-9 rounded-lg filter drop-shadow-sm" src={msg.file_url}>
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                    ) : msg.file_url && (
                      <div className="mt-2.5 pt-2 border-t border-white/20">
                        <a
                          href={msg.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2 text-xs font-semibold underline ${
                            isMe ? 'text-white' : 'text-brand-600'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" /> Download Attached Deliverable / File
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer */}
        <div className="bg-white border-t border-slate-200 p-4">
          {isRecording ? (
            <div className="max-w-4xl mx-auto flex items-center justify-between bg-rose-50 border border-rose-200 rounded-2xl p-3 px-5 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                <span className="text-xs font-bold text-rose-900">
                  Recording Voice Memo... {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="btn-secondary text-xs px-3 py-1.5 font-bold text-rose-700 hover:bg-rose-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  disabled={sending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Sending...' : 'Send Voice Memo'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all shrink-0"
                title="Attach File, Code ZIP or Video (up to 500MB)"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                title="Record WhatsApp-Style Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message to mentor... (e.g. 'Can we schedule the code walkthrough?')"
                className="flex-1 input-field py-3 text-sm"
                disabled={sending}
              />

              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="btn-primary py-3 px-5 flex items-center gap-2 shrink-0 shadow-md shadow-brand-500/20"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Payment Modal for In-Chat Balance Settlement */}
      {order && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderId={order.id}
          orderNumber={order.order_number}
          amount={paymentModalType === 'advance' ? order.advance_amount : order.balance_amount}
          totalPrice={order.total_price}
          advanceAmount={order.advance_amount}
          balanceAmount={order.balance_amount}
          paymentType={paymentModalType}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}

    </div>
  );
};

export default ChatPage;
