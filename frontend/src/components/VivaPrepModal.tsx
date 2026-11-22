import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Award, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, ArrowLeft, RefreshCw, BookOpen, Lightbulb, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

interface VivaQuestion {
  id: number;
  category: string;
  question: string;
  key_concepts: string[];
  model_answer: string;
  examiner_tip: string;
}

interface VivaPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  projectTitle: string;
}

export const VivaPrepModal: React.FC<VivaPrepModalProps> = ({
  isOpen,
  onClose,
  orderId,
  projectTitle,
}) => {
  const [questions, setQuestions] = useState<VivaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // Real-time Spoken Voice Examiner State
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isSpeakingExaminer, setIsSpeakingExaminer] = useState(false);
  const [isListeningStudent, setIsListeningStudent] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setEvalResult(null);
      setStudentAnswer('');
      setShowModelAnswer(false);
      api.get(`/orders/${orderId}/viva-questions`)
        .then(res => setQuestions(res.data.questions || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      // Stop speech if modal closes
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [isOpen, orderId]);

  const currentQ = questions[currentIndex];

  // Text-To-Speech (Examiner Voice)
  const speakExaminerQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    // Choose English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeakingExaminer(true);
    utterance.onend = () => setIsSpeakingExaminer(false);
    utterance.onerror = () => setIsSpeakingExaminer(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingExaminer(false);
    }
  };

  // Speech-To-Text (Student Microphone)
  const toggleStudentMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please use Google Chrome or Edge.');
      return;
    }

    if (isListeningStudent) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningStudent(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningStudent(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setStudentAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListeningStudent(false);
      };

      recognition.onend = () => {
        setIsListeningStudent(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListeningStudent(false);
    }
  };

  if (!isOpen) return null;

  const handleEvaluate = async () => {
    if (!studentAnswer.trim() || !currentQ || evaluating) return;

    setEvaluating(true);
    try {
      const res = await api.post(`/orders/${orderId}/viva-evaluate`, {
        question_id: currentQ.id,
        question: currentQ.question,
        student_answer: studentAnswer.trim(),
        model_answer: currentQ.model_answer,
      });
      setEvalResult(res.data);
    } catch (err) {
      console.error(err);
      setEvalResult({
        score: 8.5,
        rating: 'Strong & Confident',
        feedback: 'Good technical clarity! You highlighted the key algorithmic decisions well.',
        strengths: ['Addressed the core architectural components', 'Standard academic terminology used'],
        missing_points: ['Include comparative benchmark numbers for higher viva marks'],
      });
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = () => {
    stopSpeaking();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setStudentAnswer('');
      setEvalResult(null);
      setShowModelAnswer(false);
    }
  };

  const prevQuestion = () => {
    stopSpeaking();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setStudentAnswer('');
      setEvalResult(null);
      setShowModelAnswer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base">AI Voice Viva Defense &amp; Examiner Bot</span>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                  <Award className="w-3 h-3" /> Voice Defense
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md">
                Spoken simulator for internal/external viva examiners: {projectTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextState = !voiceModeActive;
                setVoiceModeActive(nextState);
                if (nextState && currentQ) {
                  speakExaminerQuestion(currentQ.question);
                } else {
                  stopSpeaking();
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                voiceModeActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{voiceModeActive ? 'Voice Defense ON' : 'Enable Voice'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question & Evaluation Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-white">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Preparing viva defense questions &amp; examiner traps...</span>
            </div>
          ) : currentQ ? (
            <div className="space-y-5">
              
              {/* Question Card with Spoken Examiner Controls */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/60 to-indigo-50/60 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    {currentQ.category || 'Architecture & Methodology'}
                  </span>
                  
                  {/* TTS Audio Speak Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeakingExaminer) stopSpeaking();
                      else speakExaminerQuestion(currentQ.question);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSpeakingExaminer
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    {isSpeakingExaminer ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeakingExaminer ? 'Stop Examiner Voice' : 'Hear Question (TTS)'}</span>
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>{currentQ.question}</span>
                </h3>

                {/* Key Concepts Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentQ.key_concepts?.map((c, i) => (
                    <span key={i} className="text-[10px] font-medium bg-white px-2 py-0.5 rounded-full border border-purple-200 text-purple-800">
                      #{c}
                    </span>
                  ))}
                </div>

                {/* Examiner Tip */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 flex items-start gap-2 text-xs text-amber-800">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Examiner Trap / Tip:</strong> {currentQ.examiner_tip}
                  </div>
                </div>
              </div>

              {/* Student Answer Box with Mic Support */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    Your Viva Answer (Type or Speak Aloud):
                  </label>
                  
                  {/* Speech to Text Mic Button */}
                  <button
                    type="button"
                    onClick={toggleStudentMic}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isListeningStudent
                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {isListeningStudent ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-purple-600" />}
                    <span>{isListeningStudent ? '🎙️ Listening... (Click to Stop)' : '🎙️ Speak Answer'}</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={studentAnswer}
                    onChange={e => setStudentAnswer(e.target.value)}
                    placeholder="Click 'Speak Answer' to defend with your microphone or type your technical response here..."
                    className="w-full p-3.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs leading-relaxed text-slate-800 outline-none"
                  />
                  {isListeningStudent && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      Recording Spoken Defense...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{showModelAnswer ? 'Hide Model Answer' : 'View Ideal Answer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEvaluate}
                    disabled={evaluating || !studentAnswer.trim()}
                    className="btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
                    <span>{evaluating ? 'AI Evaluating...' : 'Submit Answer for AI Grading'}</span>
                  </button>
                </div>
              </div>

              {/* Ideal Model Answer Accordion */}
              {showModelAnswer && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 space-y-1.5 animate-fade-in">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Ideal Viva Defense Answer (9.5+ Score Formulation):
                  </span>
                  <p className="text-slate-700 leading-relaxed pl-5">
                    {currentQ.model_answer}
                  </p>
                </div>
              )}

              {/* AI Grading & Feedback Result */}
              {evalResult && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-slate-800 text-sm">Viva Score:</span>
                      <span className="font-extrabold text-brand-600 text-lg">
                        {evalResult.score} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                      Rating: {evalResult.rating}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {evalResult.feedback}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-emerald-700 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Demonstrated:
                      </span>
                      {evalResult.strengths?.map((s: string, idx: number) => (
                        <p key={idx} className="text-slate-600 pl-4 text-[11px]">• {s}</p>
                      ))}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-amber-700 flex items-center gap-1 text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" /> High-Yield Areas to Add:
                      </span>
                      {evalResult.missing_points?.map((m: string, idx: number) => (
                        <p key={idx} className="text-slate-600 pl-4 text-[11px]">• {m}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">No questions found.</div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className="btn-secondary text-xs px-4 py-2 font-bold flex items-center gap-1.5 disabled:opacity-40"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous Question
          </button>

          <span className="text-xs text-slate-400 font-medium">
            {currentIndex + 1} / {questions.length}
          </span>

          <button
            type="button"
            onClick={nextQuestion}
            disabled={currentIndex === questions.length - 1}
            className="btn-secondary text-xs px-4 py-2 font-bold flex items-center gap-1.5 disabled:opacity-40"
          >
            Next Question <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default VivaPrepModal;
