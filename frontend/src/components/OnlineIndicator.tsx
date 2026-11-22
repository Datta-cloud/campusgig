import React from 'react';

interface OnlineIndicatorProps {
  isOnline: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ isOnline, showLabel = true, size = 'sm' }) => {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex">
        {isOnline && (
          <span className={`animate-ping absolute inline-flex ${dotSize} rounded-full bg-green-400 opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
      </span>
      {showLabel && (
        <span className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-gray-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  );
};

export default OnlineIndicator;
