import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  name,
  type = 'text',
  error,
  placeholder,
  className = '',
  required = false,
  rightElement,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col w-full text-left gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-dark/70 tracking-wider uppercase select-none">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative w-full flex items-center">
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 text-sm bg-background border rounded-xl transition-all duration-200 outline-none focus-ring ${
            error 
              ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400 bg-red-50/10' 
              : 'border-dark/10 hover:border-dark/20'
          } ${rightElement ? 'pr-11' : ''}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-500 font-medium pl-1 select-none">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
