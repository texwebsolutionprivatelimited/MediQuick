import React from 'react';
import { motion } from 'framer-motion';

export default function Card({
  children,
  onClick,
  hoverable = true,
  padding = 'p-6', // standard spacing
  className = '',
  ...props
}) {
  const isClickable = !!onClick;

  const cardClasses = `bg-white border border-dark/5 rounded-2xl shadow-soft ${padding} ${
    isClickable ? 'cursor-pointer' : ''
  } ${className}`;

  if (hoverable || isClickable) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ 
          scale: 1.015,
          boxShadow: '0 12px 30px -4px rgba(6, 59, 68, 0.08), 0 4px 12px -2px rgba(6, 59, 68, 0.04)',
          borderColor: 'rgba(0, 150, 136, 0.15)'
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className={cardClasses}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
}
