import React from 'react';
import { GitCompare, Sparkles, Terminal } from 'lucide-react';

export default function InputPanel({
  repoUrl,
  setRepoUrl,
  fromTag,
  setFromTag,
  toTag,
  setToTag,
  demoMode,
  setDemoMode,
  isLoading,
  onSubmit
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repoUrl.trim() || !fromTag.trim() || !toTag.trim()) return;
    onSubmit();
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-200">Configuration</h2>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 rounded-full px-3 py-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Mode:</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            demoMode ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
          }`}>
            {demoMode ? 'OFFLINE DEMO' : 'LIVE AGENT'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            GitHub Repository URL
          </label>
          <div className="relative">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="e.g., https://github.com/fastapi/fastapi"
              disabled={isLoading}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm transition-all focus:outline-none disabled:opacity-50"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              From Tag / Commit Ref
            </label>
            <input
              type="text"
              value={fromTag}
              onChange={(e) => setFromTag(e.target.value)}
              placeholder="e.g., v0.100.0"
              disabled={isLoading}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm transition-all focus:outline-none disabled:opacity-50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              To Tag / Commit Ref
            </label>
            <input
              type="text"
              value={toTag}
              onChange={(e) => setToTag(e.target.value)}
              placeholder="e.g., v0.101.0"
              disabled={isLoading}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm transition-all focus:outline-none disabled:opacity-50"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Analyzing Repository...</span>
            </>
          ) : (
            <>
              <GitCompare className="w-5 h-5 text-indigo-200 group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-semibold">Generate Release Artifacts</span>
              <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse ml-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
