
import React, { useState } from 'react';
import { GardenPreferences } from '../types';

interface PreferenceFormProps {
  initialPreferences: GardenPreferences;
  onSubmit: (prefs: GardenPreferences) => void;
  disabled: boolean;
}

const PreferenceForm: React.FC<PreferenceFormProps> = ({ initialPreferences, onSubmit, disabled }) => {
  const [prefs, setPrefs] = useState<GardenPreferences>(initialPreferences);

  const STYLES = ['Modern Minimalist', 'English Cottage', 'Japanese Zen', 'Mediterranean', 'Tropical Jungle', 'Desert Xeriscape'];
  const CLIMATES = ['Tropical', 'Dry/Arid', 'Temperate', 'Mediterranean', 'Continental', 'Polar'];
  const SIZES = ['Small (<100 sq ft)', 'Medium (100-500 sq ft)', 'Large (500-1500 sq ft)', 'Estate (1500+ sq ft)'];
  const BUDGETS = ['Value-conscious', 'Moderate', 'Premium', 'Ultra-luxury'];
  const AVAILABLE_FEATURES = ['Deck', 'Patio', 'Fire pit', 'Water feature', 'Vegetable garden', 'Lawn', 'Outdoor kitchen', 'Pergola', 'Ambient lighting'];

  const handleFeatureToggle = (feature: string) => {
    setPrefs(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Design Style</label>
        <select 
          value={prefs.style}
          onChange={(e) => setPrefs({...prefs, style: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        >
          {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Climate</label>
          <select 
            value={prefs.climate}
            onChange={(e) => setPrefs({...prefs, climate: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          >
            {CLIMATES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Size</label>
          <select 
            value={prefs.size}
            onChange={(e) => setPrefs({...prefs, size: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          >
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Features</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_FEATURES.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => handleFeatureToggle(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                prefs.features.includes(f)
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Palette</label>
        <input 
          type="text"
          value={prefs.colors}
          onChange={(e) => setPrefs({...prefs, colors: e.target.value})}
          placeholder="e.g. Lavender, Sage, and Slate"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Budget Level</label>
        <select 
          value={prefs.budget}
          onChange={(e) => setPrefs({...prefs, budget: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        >
          {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <button
        onClick={() => onSubmit(prefs)}
        disabled={disabled}
        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        <i className="fa-solid fa-wand-magic-sparkles"></i>
        <span>{disabled ? 'Architecting...' : 'Generate My Garden'}</span>
      </button>
    </div>
  );
};

export default PreferenceForm;
