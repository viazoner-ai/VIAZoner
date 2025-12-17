
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-600 p-2 rounded-xl">
            <i className="fa-solid fa-tree text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 leading-none">GardenDreamer</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">AI Landscape Architect</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#" className="text-emerald-600 border-b-2 border-emerald-600 pb-1">Designer</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Plant Library</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Gallery</a>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-sm">
            Save Project
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
