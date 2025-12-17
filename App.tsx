
import React, { useState, useCallback } from 'react';
import { GardenPreferences, GardenLayout, GeneratedImage } from './types';
import { geminiService } from './services/geminiService';
import Header from './components/Header';
import PreferenceForm from './components/PreferenceForm';
import GardenDisplay from './components/GardenDisplay';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [preferences, setPreferences] = useState<GardenPreferences>({
    style: 'Modern Minimalist',
    size: 'Medium (200-500 sq ft)',
    climate: 'Mediterranean',
    features: ['Deck', 'Fire pit'],
    budget: 'Moderate',
    colors: 'Greens, Whites, and Grays'
  });

  const [layout, setLayout] = useState<GardenLayout | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleGenerate = async (prefs: GardenPreferences) => {
    setIsLoading(true);
    setLoadingMessage('Architecting your dream layout...');
    try {
      setPreferences(prefs);
      const newLayout = await geminiService.generateGardenLayout(prefs);
      setLayout(newLayout);
      
      setLoadingMessage('Rendering visual designs...');
      const imageUrl = await geminiService.generateGardenImage(newLayout, prefs);
      
      const newImg: GeneratedImage = {
        id: Math.random().toString(36).substr(2, 9),
        url: imageUrl,
        prompt: `Initial generation for ${newLayout.title}`,
        timestamp: Date.now()
      };
      
      setImages(prev => [newImg, ...prev]);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error("Error generating garden:", error);
      alert("Something went wrong while designing your garden. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditImage = async (editPrompt: string) => {
    if (currentImageIndex === -1 || !images[currentImageIndex]) return;

    setIsLoading(true);
    setLoadingMessage(`Applying changes: "${editPrompt}"...`);
    try {
      const currentImg = images[currentImageIndex];
      const newImageUrl = await geminiService.editGardenImage(currentImg.url, editPrompt);
      
      const newImg: GeneratedImage = {
        id: Math.random().toString(36).substr(2, 9),
        url: newImageUrl,
        prompt: editPrompt,
        timestamp: Date.now()
      };
      
      setImages(prev => [newImg, ...prev]);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error("Error editing garden:", error);
      alert("Failed to edit the garden visual. Please try a different prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Preferences */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                <i className="fa-solid fa-sliders mr-2 text-emerald-600"></i>
                Garden Preferences
              </h2>
              <PreferenceForm 
                initialPreferences={preferences} 
                onSubmit={handleGenerate} 
                disabled={isLoading} 
              />
            </div>
          </section>

          {images.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">History</h3>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <button 
                    key={img.id}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === idx ? 'border-emerald-500 scale-95 shadow-inner' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Content: Results */}
        <div className="lg:col-span-8">
          {layout ? (
            <GardenDisplay 
              layout={layout} 
              currentImage={images[currentImageIndex]} 
              onEdit={handleEditImage}
              isLoading={isLoading}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <i className="fa-solid fa-leaf text-4xl text-emerald-500 animate-pulse"></i>
              </div>
              <h2 className="text-3xl font-serif font-bold text-slate-800 mb-4">Start Your Design Journey</h2>
              <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                Describe your dream outdoor space on the left, and our AI landscape architect will generate a custom layout and photorealistic renders for you.
              </p>
            </div>
          )}
        </div>
      </main>

      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="container mx-auto px-4 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} GardenDreamer AI. Empowered by Gemini 2.5 Flash Image.
        </div>
      </footer>
    </div>
  );
};

export default App;
