
import React, { useState } from 'react';
import { GardenLayout, GeneratedImage } from '../types';

interface GardenDisplayProps {
  layout: GardenLayout;
  currentImage?: GeneratedImage;
  onEdit: (prompt: string) => void;
  isLoading: boolean;
}

const GardenDisplay: React.FC<GardenDisplayProps> = ({ layout, currentImage, onEdit, isLoading }) => {
  const [editPrompt, setEditPrompt] = useState('');

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPrompt.trim()) {
      onEdit(editPrompt);
      setEditPrompt('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Visual Render Section */}
      <section className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative group">
        <div className="aspect-[16/9] w-full bg-slate-100 overflow-hidden relative">
          {currentImage ? (
            <>
              <img src={currentImage.url} alt="Garden Visualization" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex items-end justify-between">
                <div>
                  <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest bg-emerald-950/40 px-3 py-1 rounded-full backdrop-blur-md">Visual Render</span>
                  <p className="text-white text-sm mt-2 opacity-80 line-clamp-1">{currentImage.prompt}</p>
                </div>
                <div className="flex gap-2">
                   <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-all">
                     <i className="fa-solid fa-expand"></i>
                   </button>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <i className="fa-solid fa-image text-slate-300 text-6xl"></i>
            </div>
          )}
        </div>

        {/* AI Editor Toolbar */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <form onSubmit={handleEditSubmit} className="flex gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Ask AI to edit: 'Add a koi pond', 'Replace grass with gravel', 'Make it sunset'..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white border border-slate-200 px-5 py-3.5 pr-12 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm disabled:opacity-70"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="fa-solid fa-sparkles"></i>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !editPrompt}
              className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
            >
              Modify Design
            </button>
          </form>
          <div className="mt-3 flex gap-4 text-[11px] text-slate-400 font-medium ml-2">
            <span>PROMPT EXAMPLES:</span>
            <button onClick={() => setEditPrompt("Add a vibrant retro filter")} className="hover:text-emerald-600 underline decoration-emerald-600/30">Retro Filter</button>
            <button onClick={() => setEditPrompt("Add some white blooming peonies")} className="hover:text-emerald-600 underline decoration-emerald-600/30">Add Peonies</button>
            <button onClick={() => setEditPrompt("Change to autumn season with orange leaves")} className="hover:text-emerald-600 underline decoration-emerald-600/30">Autumn Look</button>
          </div>
        </div>
      </section>

      {/* Structured Layout Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6 flex items-center">
            <i className="fa-solid fa-map-location-dot text-emerald-600 mr-3"></i>
            Architectural Zoning
          </h3>
          <div className="space-y-6">
            {layout.zoning.map((z, i) => (
              <div key={i} className="group">
                <div className="flex items-center space-x-3 mb-1">
                   <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                     {i + 1}
                   </span>
                   <h4 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{z.zone}</h4>
                </div>
                <p className="text-slate-600 leading-relaxed pl-11">{z.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6 flex items-center">
            <i className="fa-solid fa-seedling text-emerald-600 mr-3"></i>
            Plant Recommendations
          </h3>
          <div className="space-y-4">
            {layout.suggestedPlants.map((plant, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all hover:bg-emerald-50 group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{plant.name}</h4>
                  <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Verified Choice</span>
                </div>
                <p className="text-sm text-slate-600 mb-2 leading-snug">{plant.description}</p>
                <div className="text-xs italic text-slate-400 group-hover:text-emerald-600/70">
                  <i className="fa-solid fa-circle-info mr-1"></i>
                  {plant.reason}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="bg-emerald-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl shadow-emerald-200/50">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-3xl font-serif font-bold mb-4">Designer's Philosophy</h3>
          <p className="text-emerald-100 leading-relaxed italic opacity-90 text-lg">
            "{layout.description}"
          </p>
        </div>
        <i className="fa-solid fa-quote-right absolute -right-4 -bottom-4 text-9xl text-white/10 rotate-12"></i>
      </div>
    </div>
  );
};

export default GardenDisplay;
