import React from 'react';
import { MdRemove, MdAdd } from 'react-icons/md';

export default function QuantityStepper({ 
  quantity, 
  onIncrease, 
  onDecrease, 
  className = '', 
  isLarge = false 
}) {
  return (
    <div 
      className={`flex items-center justify-between bg-primary/5 border border-primary/20 text-primary font-bold rounded-xl overflow-hidden select-none shadow-sm transition-all animate-popIn ${
        isLarge ? 'h-[48px]' : 'h-[34px]'
      } ${className}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrease();
        }}
        className="h-full px-3 text-primary/70 hover:text-white hover:bg-primary transition-all cursor-pointer font-bold outline-none flex items-center justify-center"
      >
        <MdRemove className={isLarge ? 'text-lg' : 'text-xs'} />
      </button>

      <span className={`flex-grow text-center text-primary font-extrabold select-none ${isLarge ? 'text-sm' : 'text-[10px]'}`}>
        {quantity}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIncrease();
        }}
        className="h-full px-3 text-primary/70 hover:text-white hover:bg-primary transition-all cursor-pointer font-bold outline-none flex items-center justify-center"
      >
        <MdAdd className={isLarge ? 'text-lg' : 'text-xs'} />
      </button>
    </div>
  );
}
