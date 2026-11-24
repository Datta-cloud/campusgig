import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Order } from '../types';

interface OrderProgressTrackerProps {
  order?: Order | null;
  sampleMode?: boolean;
}

export const OrderProgressTracker: React.FC<OrderProgressTrackerProps> = ({
  order,
  sampleMode = false,
}) => {
  // Title and order number
  const projectTitle = sampleMode || !order
    ? 'Machine Learning Project Guidance'
    : (order.project_title || 'Academic Capstone Project');

  const orderNumber = sampleMode || !order
    ? 'CG1024'
    : (order.order_number || 'CG1024');

  const subtitle = sampleMode || !order
    ? 'Order #CG1024 · Illustrative preview'
    : `Order #${orderNumber} · Live tracking`;

  // Status mapping
  // Lifecycle steps:
  // 1: Order placed (pending_payment, payment_submitted)
  // 2: Accepted (advance_paid)
  // 3: In progress (in_progress)
  // 4: Delivered (ready_for_review, revision_requested, balance_submitted)
  // 5: Completed (completed)
  const currentStatus = sampleMode || !order ? 'in_progress' : order.status;

  const getStepIndex = (status: string): number => {
    switch (status) {
      case 'pending_payment':
      case 'payment_submitted':
        return 1;
      case 'advance_paid':
        return 2;
      case 'in_progress':
        return 3;
      case 'ready_for_review':
      case 'revision_requested':
      case 'balance_submitted':
        return 4;
      case 'completed':
        return 5;
      default:
        return 3;
    }
  };

  const activeStepIdx = getStepIndex(currentStatus);

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'completed':
        return { label: 'Completed', className: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' };
      case 'ready_for_review':
        return { label: 'Delivered', className: 'bg-purple-950/80 text-purple-400 border-purple-800/60' };
      case 'revision_requested':
        return { label: 'Revision', className: 'bg-amber-950/80 text-amber-400 border-amber-800/60' };
      case 'advance_paid':
        return { label: 'Accepted', className: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/60' };
      case 'pending_payment':
      case 'payment_submitted':
        return { label: 'Order placed', className: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
      case 'in_progress':
      default:
        return { label: 'In progress', className: 'bg-blue-950/80 text-blue-400 border-blue-800/60' };
    }
  };

  const badge = getStatusBadge();

  const steps = [
    {
      id: 1,
      title: 'Order placed',
      desc: 'Order successfully created',
    },
    {
      id: 2,
      title: 'Accepted',
      desc: 'Freelancer accepted the order',
    },
    {
      id: 3,
      title: 'In progress',
      desc: 'Freelancer is working on your order',
    },
    {
      id: 4,
      title: 'Delivered',
      desc: activeStepIdx >= 4 ? 'Deliverables ready for your review' : undefined,
    },
    {
      id: 5,
      title: 'Completed',
      desc: activeStepIdx >= 5 ? 'Order completed & deliverables unlocked' : undefined,
    },
  ];

  return (
    <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 text-white shadow-xl max-w-2xl w-full transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-white text-base sm:text-lg font-bold leading-snug">
            {projectTitle}
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            {subtitle}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border shrink-0 transition-colors ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800/90 my-5" />

      {/* Vertical Timeline Stepper */}
      <div className="space-y-0 pl-1">
        {steps.map((step, idx) => {
          const isDone = activeStepIdx > step.id;
          const isCurrent = activeStepIdx === step.id;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Left Column: Icon + Vertical Connecting Line */}
              <div className="flex flex-col items-center shrink-0">
                {/* Node Icon */}
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 flex items-center justify-center text-blue-400">
                    {/* SVG Sunburst Spinner matching the exact screenshot */}
                    <svg
                      className="w-5 h-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="12" y1="2" x2="12" y2="6" strokeOpacity="1" />
                      <line x1="12" y1="18" x2="12" y2="22" strokeOpacity="0.4" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" strokeOpacity="0.9" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" strokeOpacity="0.3" />
                      <line x1="2" y1="12" x2="6" y2="12" strokeOpacity="0.8" />
                      <line x1="18" y1="12" x2="22" y2="12" strokeOpacity="0.2" />
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" strokeOpacity="0.7" />
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" strokeOpacity="0.1" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-600" />
                )}

                {/* Vertical Line */}
                {!isLast && (
                  <div
                    className={`w-0.5 my-1 transition-colors ${
                      isDone
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-zinc-700'
                        : 'bg-zinc-700'
                    }`}
                    style={{ height: step.desc ? '34px' : '20px' }}
                  />
                )}
              </div>

              {/* Right Column: Title and Subtitle */}
              <div className="pt-0 pb-3 flex-1 min-w-0">
                <h4
                  className={`text-sm ${
                    isDone || isCurrent
                      ? 'font-bold text-white'
                      : 'font-medium text-zinc-400'
                  }`}
                >
                  {step.title}
                </h4>

                {step.desc && (
                  <p className="text-xs text-zinc-400 mt-1">
                    {step.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderProgressTracker;
