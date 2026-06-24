import React from 'react';
import { Terminal } from 'lucide-react';

export default function InputPanel({
  repoUrl,
  setRepoUrl,
  fromTag,
  setFromTag,
  toTag,
  setToTag,
  demoMode,
  isLoading,
  onSubmit
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    onSubmit();
  };

  return (
    <div className="bg-black border border-zinc-850 rounded-lg p-5 space-y-5 shadow-sm text-zinc-200">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Configurations</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">MODE:</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
            demoMode 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
              : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
          }`}>
            {demoMode ? 'OFFLINE DEMO' : 'LIVE AGENT'}
          </span>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Repository URL
          </label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            disabled={isLoading}
            className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 placeholder-zinc-600 text-xs transition focus:outline-none focus:border-zinc-600 focus:ring-0 disabled:opacity-40"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              From Tag <span className="text-[9px] text-zinc-550 lowercase font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={fromTag}
              onChange={(e) => setFromTag(e.target.value)}
              placeholder="v0.100.0"
              disabled={isLoading}
              className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 placeholder-zinc-600 text-xs transition focus:outline-none focus:border-zinc-600 focus:ring-0 disabled:opacity-40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              To Tag <span className="text-[9px] text-zinc-550 lowercase font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={toTag}
              onChange={(e) => setToTag(e.target.value)}
              placeholder="v0.101.0"
              disabled={isLoading}
              className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 placeholder-zinc-600 text-xs transition focus:outline-none focus:border-zinc-600 focus:ring-0 disabled:opacity-40"
            />
          </div>
        </div>

        {/* High-Contrast Vercel-inspired Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs tracking-wide py-2.5 rounded transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
              <span>Analyzing Git Logs...</span>
            </>
          ) : (
            <span>Generate Documentation</span>
          )}
        </button>
      </form>
    </div>
  );
}
