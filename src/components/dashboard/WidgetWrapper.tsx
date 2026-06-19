import React from 'react';


interface WidgetWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ title, children, className = '', action }) => {
  return (
    <div className={`bg-bg-secondary rounded-lg p-4 shadow-sm flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[18px] font-semibold text-text-primary">{title}</h2>
        {action && action}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
