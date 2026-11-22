import React, { useRef } from 'react';
import { X, Award, ShieldCheck, Printer, Share2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificateId: string;
  studentName: string;
  collegeName?: string;
  projectTitle: string;
  domain?: string;
  issueDate?: string;
  plagiarismScore?: number;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificateId,
  studentName,
  collegeName,
  projectTitle,
  domain,
  issueDate,
  plagiarismScore = 4.2,
}) => {
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const verificationUrl = `${window.location.origin}/verify/${certificateId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verificationUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(
      `Excited to share that I have successfully implemented and completed my engineering project "${projectTitle}" with distinction via CampusGig Mentorship! Certificate ID: ${certificateId}`
    );
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-slide-up my-8">
        
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-xs text-slate-800">Verifiable Academic Certificate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareLinkedIn}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700"
            >
              <Share2 className="w-3.5 h-3.5" /> Share on LinkedIn
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div
          ref={certRef}
          className="p-8 sm:p-12 bg-gradient-to-br from-[#fcfbf7] via-[#fffdf9] to-[#fbf9f2] text-slate-900 relative border-8 border-amber-600/30 m-4 rounded-2xl shadow-inner select-text print:m-0 print:border-4"
        >
          {/* Outer Ornamental Frame */}
          <div className="border border-amber-700/40 p-6 sm:p-10 rounded-xl relative">
            
            {/* Top Crest & Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 text-white flex items-center justify-center mx-auto shadow-md border-2 border-white">
                <Award className="w-9 h-9" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-black uppercase tracking-widest text-slate-900 pt-1">
                CampusGig Academic Council
              </h2>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 block">
                Certificate of Engineering Implementation & Distinction
              </span>
            </div>

            {/* Recipient Details */}
            <div className="text-center my-8 space-y-3">
              <p className="text-xs italic text-slate-500 font-serif">This is to certify that</p>
              <h3 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 tracking-wide border-b border-amber-600/30 pb-2 inline-block px-8">
                {studentName}
              </h3>
              {collegeName && (
                <p className="text-xs font-semibold text-slate-600 tracking-wide">
                  Representing: <span className="text-slate-900 font-bold">{collegeName}</span>
                </p>
              )}
            </div>

            {/* Project Statement */}
            <div className="max-w-2xl mx-auto text-center space-y-3 my-6">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
                Has successfully architected, developed, and defended the verified technical project titled
              </p>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 inline-block">
                <h4 className="font-bold text-sm sm:text-base text-slate-950 font-sans">
                  "{projectTitle}"
                </h4>
              </div>
              <p className="text-xs text-slate-600 font-serif">
                Domain Specification: <strong className="text-slate-800">{domain || 'Computer Engineering'}</strong> • All Phase Deliverables Verified.
              </p>
            </div>

            {/* Turnitin & Originality Badges */}
            <div className="flex flex-wrap justify-center gap-4 my-6">
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Turnitin Originality Verified (&lt; 10% Plagiarism)</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-300 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Source Code &amp; IEEE Specification Unlocked</span>
              </div>
            </div>

            {/* Footer with Signatures and QR Code */}
            <div className="pt-8 border-t border-amber-600/30 grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-center sm:text-left mt-8">
              
              {/* Left: Issued Date */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Date of Issue</span>
                <span className="text-xs font-serif font-bold text-slate-800">
                  {issueDate ? new Date(issueDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'November 2026'}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">ID: {certificateId}</span>
              </div>

              {/* Center: Verification QR */}
              <div className="flex flex-col items-center justify-center">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-16 h-16 object-contain border border-amber-200 rounded p-1 bg-white shadow-sm"
                />
                <span className="text-[9px] text-slate-500 font-mono mt-1">Scan to Verify Authenticity</span>
              </div>

              {/* Right: Signature */}
              <div className="text-center sm:text-right space-y-1">
                <div className="font-serif italic text-lg text-slate-800 font-bold tracking-wider">
                  CampusGig Academic Board
                </div>
                <div className="w-32 sm:ml-auto border-t border-slate-400 my-1"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Authorized Signatory</span>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CertificateModal;
