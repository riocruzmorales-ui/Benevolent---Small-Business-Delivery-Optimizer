
import React, { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { AppState, Address, RouteConfig, OptimizedStop } from './types';
import { geocodeAndOptimize } from './services/optimizer';
import { MapView } from './components/MapView';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppState>(AppState.LANDING);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedStop[]>([]);
  const [config, setConfig] = useState<RouteConfig>({
    depot: '',
    vehicleCount: 1,
    returnToStart: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const newAddresses: Address[] = lines.map((line, idx) => ({
        id: `file-${idx}-${Date.now()}`,
        raw: line.trim(),
        isValid: true,
        isCompleted: false,
      }));
      setAddresses(prev => [...prev, ...newAddresses]);
      setCurrentStep(AppState.CONFIG);
    };
    reader.readAsText(file);
  };

  const addManualAddress = () => {
    if (!manualInput.trim()) return;
    const newAddr: Address = {
      id: `manual-${Date.now()}`,
      raw: manualInput,
      isValid: true,
      isCompleted: false,
    };
    setAddresses(prev => [...prev, newAddr]);
    setManualInput('');
    if (currentStep === AppState.LANDING) setCurrentStep(AppState.CONFIG);
  };

  const startOptimization = async () => {
    if (!config.depot) {
      alert("Please provide a starting depot address.");
      return;
    }
    setIsLoading(true);
    setCurrentStep(AppState.PROCESSING);

    try {
      const result = await geocodeAndOptimize(addresses, config);
      setOptimizedRoute(result);
      setCurrentStep(AppState.RESULTS);
    } catch (err) {
      console.error(err);
      alert("Optimization failed. Please try again.");
      setCurrentStep(AppState.CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = (id: string) => {
    setOptimizedRoute(prev => prev.map(stop => 
      stop.id === id ? { ...stop, isCompleted: !stop.isCompleted } : stop
    ));
  };

  const nextStop = useMemo(() => {
    return optimizedRoute.find((s, i) => !s.isCompleted);
  }, [optimizedRoute]);

  const progress = useMemo(() => {
    if (optimizedRoute.length === 0) return 0;
    const completed = optimizedRoute.filter(s => s.isCompleted).length;
    return Math.round((completed / optimizedRoute.length) * 100);
  }, [optimizedRoute]);

  const fullRouteLink = useMemo(() => {
    if (optimizedRoute.length === 0) return '';
    const origin = encodeURIComponent(config.depot);
    const waypointsArr = optimizedRoute.slice(1);
    if (config.returnToStart) waypointsArr.pop();
    const waypoints = waypointsArr.map(s => encodeURIComponent(s.raw)).join('|');
    const destination = config.returnToStart ? origin : encodeURIComponent(optimizedRoute[optimizedRoute.length - 1].raw);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
  }, [optimizedRoute, config]);

  return (
    <Layout>
      {currentStep === AppState.LANDING && (
        <div className="flex flex-col gap-12 py-8 animate-in fade-in duration-700">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Optimize Your Routes <br/>
              <span className="text-amber-500">Save Fuel, Time, & Money.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Stateless delivery route optimization for small business fleets.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-3xl p-10 flex flex-col items-center justify-center text-center group hover:border-amber-500 transition-all cursor-pointer relative overflow-hidden">
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-slate-900 transition-colors">
                <i className="fas fa-file-upload text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upload CSV / List</h3>
              <p className="text-slate-400 text-sm">Drag and drop address file</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <i className="fas fa-keyboard text-amber-500"></i> Manual Entry
              </h3>
              <div className="space-y-4">
                <textarea 
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste addresses (one per line)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none h-32 resize-none"
                />
                <button onClick={addManualAddress} className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-amber-400 transition-colors active:scale-95 flex items-center justify-center gap-2">
                  <i className="fas fa-plus"></i> Add Stops
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === AppState.CONFIG && (
        <div className="max-w-xl mx-auto py-8">
          <div className="bg-slate-800 border border-slate-700 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <i className="fas fa-sliders-h text-amber-500"></i> Route Setup
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">Start Depot Address</label>
                <input 
                  type="text" 
                  value={config.depot}
                  onChange={(e) => setConfig({ ...config, depot: e.target.value })}
                  placeholder="Your starting point..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setConfig({...config, returnToStart: !config.returnToStart})} className={`flex-grow h-16 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-black ${config.returnToStart ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-slate-700 text-slate-500'}`}>
                   {config.returnToStart ? <i className="fas fa-sync-alt"></i> : <i className="fas fa-long-arrow-alt-right"></i>}
                   {config.returnToStart ? 'ROUND TRIP' : 'ONE WAY'}
                 </button>
              </div>
              <div className="pt-4">
                <button onClick={startOptimization} className="w-full bg-amber-500 text-slate-900 font-black py-6 rounded-3xl hover:bg-amber-400 transition-colors shadow-2xl shadow-amber-500/30 active:scale-[0.97] text-xl tracking-tight">
                  OPTIMIZE ROUTE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === AppState.PROCESSING && (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-10">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-route text-amber-500 text-4xl animate-pulse"></i></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">Calculating Reality...</h2>
            <p className="text-slate-500 font-medium">Finding the most efficient sequence via Google Maps.</p>
          </div>
        </div>
      )}

      {currentStep === AppState.RESULTS && (
        <div className="flex flex-col w-full gap-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* TOP SECTION: Reality View (Map) */}
          <section className="w-full h-[400px] bg-slate-950 rounded-[3rem] border border-slate-800 overflow-hidden relative shadow-2xl">
              <iframe
                title="Current Target Reality"
                width="100%"
                height="100%"
                className="opacity-80 contrast-125 saturate-50"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8)' }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(nextStop?.raw || config.depot)}&t=k&z=18&ie=UTF8&iwloc=&output=embed`}
               ></iframe>

               {/* Reality Header Overlays */}
               <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                 <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
                   <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Reality Perspective</p>
                   <h3 className="text-white font-black truncate max-w-[200px] text-xs">
                    {nextStop?.raw ? "Active Stop Analysis" : "Returning Home"}
                   </h3>
                 </div>
                 <div className="bg-blue-600 text-white font-black text-[10px] px-3 py-1.5 rounded-full shadow-lg pointer-events-auto flex items-center gap-2">
                    LIVE TARGETING
                 </div>
               </div>

               {/* Spatial Path Mini-Map Overlay */}
               <div className="absolute bottom-6 right-6 w-40 h-40 bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl p-3 overflow-hidden pointer-events-auto">
                  <MapView stops={optimizedRoute} depot={config.depot} />
               </div>
          </section>

          {/* MIDDLE SECTION: Snap Stop (The Active Card) */}
          {nextStop && (
            <section className="w-full px-2">
              <div className="bg-slate-800 border-4 border-amber-500/40 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <i className="fas fa-map-marker-alt text-9xl text-amber-500"></i>
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-amber-500 text-slate-900 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Up Next</span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Route Progress: {progress}%</p>
                  </div>
                  
                  <h3 className="text-3xl font-black mb-8 leading-tight text-white pr-12">{nextStop.raw}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nextStop.raw)}`}
                      target="_blank" rel="noreferrer"
                      className="md:col-span-3 h-20 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-3xl flex items-center justify-center gap-4 font-black text-xl shadow-xl shadow-amber-500/20 active:scale-[0.97] transition-all"
                    >
                      <i className="fas fa-location-arrow"></i> LAUNCH NAVIGATION
                    </a>
                    <button 
                      onClick={() => toggleComplete(nextStop.id)}
                      className="h-20 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-3xl flex items-center justify-center gap-2 font-black shadow-xl active:scale-[0.97] transition-all"
                    >
                      <i className="fas fa-check-circle text-2xl"></i> DONE
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* BOTTOM SECTION: Full Route Sequence */}
          <section className="w-full bg-slate-800/30 rounded-[3rem] border border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <i className="fas fa-stream text-amber-500 text-sm"></i> Full Sequence
              </h2>
              <div className="flex gap-3">
                <a href={fullRouteLink} target="_blank" rel="noreferrer" className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-2">
                  <i className="fas fa-external-link-alt text-[10px]"></i> View All
                </a>
              </div>
            </div>

            <div className="px-8 py-6 space-y-4">
              {optimizedRoute.map((stop, index) => (
                <div 
                  key={stop.id} 
                  className={`relative flex gap-6 p-6 rounded-3xl border transition-all duration-300 ${
                    stop.isCompleted 
                    ? 'bg-slate-900/20 border-slate-900 opacity-30 grayscale' 
                    : stop.id === nextStop?.id 
                      ? 'bg-slate-800 border-amber-500/30 shadow-lg' 
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-xl ${
                    stop.isCompleted ? 'bg-slate-800 text-slate-600' : 
                    index === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {stop.isCompleted ? <i className="fas fa-check"></i> : index === 0 ? <i className="fas fa-home"></i> : index}
                  </div>

                  <div className="flex-grow min-w-0">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">
                      {index === 0 ? 'Departure Point' : `Stop #${index}`}
                    </p>
                    <h4 className={`font-bold text-lg leading-tight truncate ${stop.isCompleted ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                      {stop.raw}
                    </h4>
                  </div>

                  {!stop.isCompleted && stop.id !== nextStop?.id && (
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleComplete(stop.id)} className="w-12 h-12 bg-slate-700 hover:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-slate-500 transition-colors">
                        <i className="fas fa-check"></i>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-8 bg-slate-900/40 border-t border-slate-800 flex justify-between items-center">
               <button 
                onClick={() => {
                  const headers = "Sequence,Address,Status\n";
                  const rows = optimizedRoute.map((s, i) => `${i},"${s.raw}",${s.isCompleted ? 'Done' : 'Pending'}`).join("\n");
                  const blob = new Blob([headers + rows], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `route-snap.csv`;
                  a.click();
                }}
                className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
               >
                 <i className="fas fa-camera text-amber-500"></i> Save Snapshot CSV
               </button>

               <button 
                onClick={() => setCurrentStep(AppState.LANDING)}
                className="text-[10px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-[0.3em] transition-colors"
               >
                 Destroy Session
               </button>
            </div>
          </section>

        </div>
      )}
    </Layout>
  );
};

export default App;
