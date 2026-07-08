import React from 'react';

export default function LoadingSkeleton({
  type = 'card', // 'card' | 'text' | 'circle' | 'search' | 'button'
  count = 1,
  className = ''
}) {
  const skeletonArray = Array.from({ length: count });

  const renderSkeleton = (index) => {
    switch (type) {
      case 'text':
        return (
          <div key={index} className={`space-y-2 animate-pulse ${className}`}>
            <div className="h-4 bg-dark/10 rounded-full w-3/4"></div>
            <div className="h-3 bg-dark/5 rounded-full w-full"></div>
            <div className="h-3 bg-dark/5 rounded-full w-5/6"></div>
          </div>
        );
      case 'circle':
        return (
          <div
            key={index}
            className={`w-12 h-12 rounded-full bg-dark/10 animate-pulse ${className}`}
          ></div>
        );
      case 'search':
        return (
          <div
            key={index}
            className={`w-full h-12 rounded-full bg-white border border-dark/5 shadow-soft animate-pulse flex items-center px-4 ${className}`}
          >
            <div className="w-5 h-5 rounded-full bg-dark/10 mr-3"></div>
            <div className="h-3 bg-dark/5 rounded-full w-1/3"></div>
          </div>
        );
      case 'button':
        return (
          <div
            key={index}
            className={`h-10 rounded-full bg-dark/10 animate-pulse w-32 ${className}`}
          ></div>
        );
      case 'card':
      default:
        return (
          <div
            key={index}
            className={`bg-white border border-dark/5 rounded-2xl p-5 shadow-soft animate-pulse space-y-4 ${className}`}
          >
            <div className="w-full h-40 bg-dark/5 rounded-xl"></div>
            <div className="h-4 bg-dark/10 rounded-full w-2/3"></div>
            <div className="h-3 bg-dark/5 rounded-full w-1/2"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-6 bg-dark/10 rounded-full w-1/3"></div>
              <div className="h-8 bg-dark/10 rounded-full w-1/4"></div>
            </div>
          </div>
        );
    }
  };

  if (count > 1) {
    return (
      <div className="contents">
        {skeletonArray.map((_, idx) => renderSkeleton(idx))}
      </div>
    );
  }

  return renderSkeleton(0);
}
