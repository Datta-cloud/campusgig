import React from 'react';
import { Order } from '../types';

type Status = Order['status'];

const statusConfig: Record<Status, { label: string; bg: string; text: string }> = {
  pending_payment: { label: 'Pending Payment', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  payment_submitted: { label: 'Payment Under Verification', bg: 'bg-amber-100', text: 'text-amber-800' },
  advance_paid: { label: 'Advance Paid', bg: 'bg-blue-100', text: 'text-blue-800' },
  in_progress: { label: 'In Progress', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  ready_for_review: { label: 'Ready for Review', bg: 'bg-purple-100', text: 'text-purple-800' },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800' },
  revision_requested: { label: 'Revision Requested', bg: 'bg-amber-100', text: 'text-amber-800' },
};

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = statusConfig[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
  return (
    <span className={`badge ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
