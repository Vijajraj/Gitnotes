import React, { useState } from 'react';
import { GitBranch, AlertCircle, Layers } from 'lucide-react';

// Import components
import InputPanel from './components/InputPanel';
import LoadingState from './components/LoadingState';
import BreakingBanner from './components/BreakingBanner';
import OutputTabs from './components/OutputTabs';

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
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col font-sans antialiased selection:bg-zinc-800 selection:text-white">
      
      {/* Hyper-Minimalist Vercel-inspired Header */}
      <header className="sticky top-0 z-50 bg-black/85 backdrop-blur-sm border-b border-zinc-900 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-100 p-1.5 rounded text-zinc-950">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wider text-white">GITNOTES</span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-widest ml-3 uppercase">Release Intelligence</span>
            </div>
          </div>
          <div className="text-[10px] font-mono border border-zinc-850 rounded px-2.5 py-1 text-zinc-400">
            Hackathon Edition v1.0
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Left Configurations Pane */}
        <section className="lg:col-span-4 space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Source Configuration</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Target any public GitHub repository tags. The LLM critic agent will ingest raw commit diffs and normalize them.
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
            <div className="text-[11px] font-mono text-amber-500 bg-amber-955/10 border border-amber-900/30 rounded p-3 text-center">
              ⚠️ Analyzing top 50 of {result.total_commits} commits
            </div>
          )}
        </section>

        {/* Right Output Viewer Pane */}
        <section className="lg:col-span-8 space-y-5">
          {isLoading && (
            <LoadingState />
          )}

          {error && (
            <div className="bg-red-950/10 border border-red-900 rounded p-5 flex gap-4 items-start shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <h4 className="font-semibold text-red-400 text-xs uppercase tracking-wider">Pipeline Failure</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
                
                {error.toLowerCase().includes("rate limit") && (
                  <div className="text-[10px] font-mono text-amber-500 bg-amber-950/10 border border-amber-900/30 p-3 rounded leading-relaxed">
                    💡 Tip: Toggle the DEMO_MODE configuration to true inside demoData.js to run with pre-cached assets and bypass API rates.
                  </div>
                )}
                
                <div>
                  <button
                    onClick={handleTryAgain}
                    className="bg-red-900/25 border border-red-800 text-red-400 hover:bg-red-900/40 text-xs font-semibold px-3 py-1.5 rounded transition"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {result && !isLoading && (
            <div className="space-y-5">
              
              {/* Stats Summary row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 border border-zinc-900 rounded p-4 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-600">Repo:</span>
                  <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white underline">{repoUrl.replace("https://github.com/", "")}</a>
                </div>
                <div>
                  <span>📊 Analyzed <strong>{result.total_commits}</strong> commits · <strong>{result.pr_count}</strong> PRs · In <strong>{result.generation_time}s</strong> · <strong>{breakingChangesCount}</strong> breaking</span>
                </div>
              </div>

              {/* Breaking warning tag banner */}
              {result.breaking_detected && (
                <BreakingBanner breakingChanges={result.categories?.breaking} />
              )}

              {/* Output Tabs & Breakdown charts */}
              <OutputTabs result={result} />
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="border border-dashed border-zinc-850 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="bg-zinc-950 p-3 rounded border border-zinc-900 text-zinc-500 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider mb-1">Workspace Idle</h3>
              <p className="text-xs text-zinc-550 max-w-xs leading-relaxed mb-5">
                Define the repository parameters and tag range, then compile the artifacts.
              </p>
              {DEMO_MODE && (
                <button
                  onClick={handleGenerate}
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-semibold px-4.5 py-1.5 rounded transition active:scale-95"
                >
                  Quick Demo (Offline)
                </button>
              )}
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-[10px] font-mono text-zinc-600">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 GitNotes. MIT License.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-400 transition">Docs</a>
            <a href="https://github.com/Vijajraj/Gitnotes" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
