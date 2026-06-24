import React, { useState } from 'react';
import { GitBranch, AlertCircle, Layers } from 'lucide-react';

// Import components
import InputPanel from './components/InputPanel';
import LoadingState from './components/LoadingState';
import BreakingBanner from './components/BreakingBanner';
import OutputTabs from './components/OutputTabs';
import DownloadButtons from './components/DownloadButtons';

// Import demo data
import { demoData, DEMO_MODE } from './demoData';

export default function App() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/fastapi/fastapi');
  const [fromTag, setFromTag] = useState('v0.100.0');
  const [toTag, setToTag] = useState('v0.101.0');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const startTime = performance.now();

    if (DEMO_MODE) {
      // plays for exactly 3.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 3500));
      const endTime = performance.now();
      const generationTime = ((endTime - startTime) / 1000).toFixed(1);
      
      setResult({
        ...demoData,
        generation_time: generationTime,
        total_commits: 48,
        was_capped: false,
        pr_count: 8
      });
      setIsLoading(false);
    } else {
      try {
        const response = await fetch('http://localhost:8000/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_url: repoUrl,
            from_tag: fromTag,
            to_tag: toTag,
          }),
        });

        if (!response.ok) {
          const detail = await response.json();
          throw new Error(detail.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        const endTime = performance.now();
        const generationTime = ((endTime - startTime) / 1000).toFixed(1);
        
        setResult({
          ...data,
          generation_time: generationTime
        });
      } catch (err) {
        console.error(err);
        setError(err.message || 'An unexpected error occurred during changelog generation.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setIsLoading(false);
  };

  const breakingChangesCount = result?.categories?.breaking?.length || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/10">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-150 to-slate-300 bg-clip-text text-transparent">
                GitNotes
              </h1>
              <p className="text-[10px] text-slate-450 uppercase tracking-widest font-semibold">
                Release Intelligence Agent
              </p>
            </div>
          </div>
          <div className="text-xs bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 font-medium text-slate-400">
            6-Hour Hackathon Build v1.0
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Configurations */}
        <section className="lg:col-span-4 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Source Parameters</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enter details for any public repository. The LLaMA agent will fetch historical logs, structure your commits, and categorize them dynamically.
            </p>
          </div>

          <InputPanel
            repoUrl={repoUrl}
            setRepoUrl={setRepoUrl}
            fromTag={fromTag}
            setFromTag={setFromTag}
            toTag={toTag}
            setToTag={setToTag}
            demoMode={DEMO_MODE}
            isLoading={isLoading}
            onSubmit={handleGenerate}
          />

          {/* Commit Capping Notice */}
          {result && result.was_capped && (
            <div className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 text-center animate-fade-in font-medium">
              ⚠️ Analyzing top 50 of {result.total_commits} commits
            </div>
          )}
        </section>

        {/* Right Column - Results Display */}
        <section className="lg:col-span-8 space-y-6">
          {isLoading && (
            <LoadingState />
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex gap-4 items-start shadow-lg shadow-rose-500/5 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold text-rose-250 text-sm">Changelog Pipeline Error</h4>
                <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
                
                {error.toLowerCase().includes("rate limit") && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5 mt-2 leading-relaxed">
                    💡 <strong>Tip:</strong> Toggle <code>DEMO_MODE = true</code> inside <code>demoData.js</code> to utilize cached data and bypass API restrictions during demonstrations.
                  </div>
                )}
                
                <div className="pt-2">
                  <button
                    onClick={handleTryAgain}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-rose-650/20"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {result && !isLoading && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Stats Banner & Header details combined */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/30 border border-slate-900 rounded-2xl p-6">
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm md:text-base">
                      Comparison Target: {fromTag} ... {toTag}
                    </h3>
                    <p className="text-xs text-slate-450 mt-1">
                      Repository URL: <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{repoUrl}</a>
                    </p>
                  </div>
                  <DownloadButtons
                    technicalContent={result.technical_changelog}
                    executiveContent={result.executive_summary}
                    version={toTag}
                  />
                </div>

                {/* 5. STATS BANNER */}
                <div className="text-xs md:text-sm text-slate-350 bg-slate-900/40 border border-slate-800/80 rounded-xl px-4 py-3 flex items-center gap-2 font-medium">
                  <span>📊</span>
                  <span>
                    Analyzed <strong>{result.total_commits}</strong> commits · <strong>{result.pr_count}</strong> PRs · Generated in <strong>{result.generation_time}s</strong> · <strong>{breakingChangesCount}</strong> breaking change{breakingChangesCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Breaking Warning if flagged */}
              {result.breaking_detected && (
                <BreakingBanner breakingChanges={result.categories?.breaking} />
              )}

              {/* Tabs Content */}
              <OutputTabs result={result} />
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="border border-dashed border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[450px] bg-slate-900/10">
              <div className="bg-slate-900/50 p-4 rounded-full border border-slate-850 text-indigo-400/80 mb-4 shadow-inner">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-200 text-base mb-1.5">No Release Artifacts Generated</h3>
              <p className="text-sm text-slate-450 max-w-sm leading-relaxed mb-6">
                Define your target repository and tag markers on the left, then click Generate to trigger the release analysis agent.
              </p>
              {DEMO_MODE && (
                <button
                  onClick={handleGenerate}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-2 rounded-xl border border-indigo-500/25 transition-all active:scale-[0.98]"
                >
                  Quick Demo (Pre-cached)
                </button>
              )}
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 GitNotes Agent. Open source under MIT License.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-350 transition-colors">Documentation</a>
            <a href="#" className="hover:text-slate-350 transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
