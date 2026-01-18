
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <header className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-slate-900 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
              <i className="fas fa-route text-xl"></i>
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">RouteReady</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Small-Biz Optimizer</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400 border border-slate-700">
              <i className="fas fa-shield-alt mr-1"></i> Stateless & Private
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto w-full p-4 md:p-6">
        {children}
      </main>

      <footer className="p-8 border-t border-slate-800 bg-slate-950 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <span>Built with ❤️ for Humanity.</span>
          </div>
          <div className="flex items-center gap-3 grayscale opacity-70 hover:opacity-100 transition-opacity">
             <div className="bg-white text-black p-1 rounded font-black text-xs px-2">B2</div>
             <span className="text-xs font-bold tracking-widest uppercase">The Benevolent Bandwidth Foundation</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
