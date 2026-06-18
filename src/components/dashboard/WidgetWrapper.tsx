import React from 'react';
import { MoreHorizontal } from 'lucide-react';

interface WidgetWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-bg-secondary rounded-lg p-4 shadow-sm flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[18px] font-semibold text-text-primary">{title}</h2>
        <button aria-label="Action menu" className="text-text-secondary hover:text-text-primary transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
