import React from 'react';
import { MdOutlineStickyNote2, MdLocalShipping } from 'react-icons/md';

export default function Badge({
  type = 'info', // 'prescription' | 'priority' | 'success' | 'warning' | 'info' | 'neutral'
  text,
  children,
  className = ''
}) {
  const badgeText = text || children;

  const styles = {
    prescription: 'bg-red-50 text-red-600 border border-red-200/50',
    priority: 'bg-secondary/10 text-secondary-dark border border-secondary/20',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50',
    warning: 'bg-amber-50 text-amber-600 border border-amber-200/50',
    info: 'bg-primary/5 text-primary-dark border border-primary/20',
    neutral: 'bg-dark/5 text-dark/60 border border-dark/10'
  };

  const icons = {
    prescription: <MdOutlineStickyNote2 className="mr-1 inline-block text-[15px] align-text-bottom" />,
    priority: <MdLocalShipping className="mr-1 inline-block text-[15px] align-text-bottom" />
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full tracking-wide select-none ${styles[type]} ${className}`}>
      {icons[type] || null}
      {badgeText}
    </span>
  );
}
