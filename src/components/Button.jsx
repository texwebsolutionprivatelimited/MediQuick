import React from 'react';
import { motion } from 'framer-motion';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left', // 'left' | 'right'
  className = '',
  ...props
}) {
  // Styles based on variants
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed select-none';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark active:bg-secondary-dark',
    outline: 'border border-primary text-primary hover:bg-primary/5 active:bg-primary/10',
    ghost: 'text-dark/80 hover:bg-dark/5 hover:text-dark active:bg-dark/10',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500/40',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-xs tracking-wide',
    md: 'px-6 py-2.5 text-sm tracking-wide',
    lg: 'px-8 py-3.5 text-base tracking-wide',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="mr-2 text-lg" />
      ) : null}

      <span>{loading ? 'Please wait...' : children}</span>

      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className="ml-2 text-lg" />
      ) : null}
    </motion.button>
  );
}
