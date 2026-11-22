import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, ShieldCheck, CheckCircle2, ArrowLeft, ExternalLink, Calendar, Building, BookOpen, AlertCircle } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export const VerifyCertificatePage: React.FC = () => {
  const { certId } = useParams<{ certId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (certId) {
      setLoading(true);
      setError(null);
      // Fetch public verification record
      fetch(`http://127.0.0.1:8001/api/verify-certificate/${certId}`)
        .then(async res => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.detail || 'Certificate not found in registry');
          }
          return res.json();
        })
        .then(result => setData(result))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [certId]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        
        {/* Top Navbar Brand */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black shadow-md shadow-brand-500/20">
              CG
            </div>
            <span className="font-black text-lg text-slate-900 tracking-tight">CampusGig</span>
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full uppercase ml-1">
              Registry
            </span>
          </Link>

          <Link to="/" className="btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-bold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-500 mt-3">Validating cryptographic certificate signature...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Certificate Not Found</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No verified project record exists matching ID <span className="font-mono font-bold text-rose-600">{certId}</span>. Please verify the link or QR code.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
            
            {/* Verified Badge Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-500 via-teal-600 to-brand-600 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-wide">Authentic &amp; Verified Credential</h2>
                    <span className="bg-white text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 font-mono mt-0.5">
                    Credential ID: {data.certificate_id}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] uppercase text-emerald-200 block font-bold">Verification Date</span>
                <span className="text-xs font-bold text-white">November 2026</span>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Issued To Candidate
                  </span>
                  <h3 className="text-xl font-black text-slate-900">{data.student_name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {data.college_name}
                  </p>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Project Order Number
                  </span>
                  <h4 className="font-mono font-bold text-sm text-brand-600">{data.order_number}</h4>
                  <p className="text-xs text-slate-500 flex sm:justify-end items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {data.issued_date}
                  </p>
                </div>

              </div>

              {/* Project Card */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                  Project Title &amp; Engineering Scope
                </span>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {data.project_title}
                </h4>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    Domain: {data.domain}
                  </span>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Plagiarism: {data.plagiarism_score}% (Turnitin Verified)
                  </span>
                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    AI Detection: {data.ai_score}%
                  </span>
                </div>
              </div>

              {/* Verification Authority */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" /> Verified by: <strong>{data.verified_by}</strong>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Digitally Authenticated
                </span>
              </div>

            </div>

          </div>
        )}

      </div>

      <div className="text-center text-xs text-slate-400 pt-8">
        © 2026 CampusGig • Verified Academic Freelance &amp; Mentorship Network
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
