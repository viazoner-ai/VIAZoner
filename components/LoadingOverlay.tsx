
import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-lg">
      <div className="relative mb-12">
        <div className="w-32 h-32 rounded-full border-4 border-emerald-100 flex items-center justify-center">
          <i className="fa-solid fa-leaf text-5xl text-emerald-600 animate-bounce"></i>
        </div>
        <div className="absolute inset-0 w-32 h-32 rounded-full border-t-4 border-emerald-600 animate-spin"></div>
      </div>
      
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-slate-900">Nurturing Your Design</h2>
        <div className="flex flex-col items-center">
          <p className="text-slate-500 font-medium tracking-wide h-6">{message}</p>
          <div className="flex space-x-2 mt-6">
            <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-75"></span>
            <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse delay-150"></span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-12 text-slate-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center space-x-3">
        <span>Powered by Gemini 2.5 Flash Image</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
