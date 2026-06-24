import React, { useState, useEffect } from 'react';
import { Copy, Download, Check, GitBranch, AlertTriangle } from 'lucide-react';
import Markdown from 'react-markdown';

// Import demo configurations
import { demoData, DEMO_MODE } from './demoData';

export default function App() {
  // Input parameters
  const [repoUrl, setRepoUrl] = useState('https://github.com/fastapi/fastapi');
  const [fromTag, setFromTag] = useState('0.100.0');
  const [toTag, setToTag] = useState('0.101.0');

  // Application states
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('changelog'); // 'changelog' | 'release-notes'
  const [loadingStep, setLoadingStep] = useState(0); // 0: Fetch, 1: Analyze, 2: Generate, 3: Ready
  const [copied, setCopied] = useState(false);

  // Derive repo name for watermark (e.g. fastapi)
  const getRepoName = (url) => {
    try {
      const clean = url.trim().replace(/\/+$/, '');
      const parts = clean.split('/');
      return parts.length > 0 ? parts[parts.length - 1].replace('.git', '') : '';
    } catch {
      return '';
    }
  };
  const repoNameWatermark = getRepoName(repoUrl);

  // Steps labels and status descriptors
  const steps = [
    { label: 'Fetch', desc: 'fetching commits from github...' },
    { label: 'Analyze', desc: 'agent reasoning about changes...' },
    { label: 'Generate', desc: 'writing technical changelog...' },
    { label: 'Ready', desc: 'generating executive summary...' }
  ];

  // Simulated steps timing during loading state
  useEffect(() => {
    let timer;
    if (isLoading) {
      setLoadingStep(0);
      
      const intervalTime = DEMO_MODE ? 900 : 1500;
      
      timer = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < 2) {
            return prev + 1;
          } else {
            clearInterval(timer);
            return prev;
          }
        });
      }, intervalTime);
    } else {
      setLoadingStep(result ? 3 : 0);
    }
    return () => clearInterval(timer);
  }, [isLoading, result]);

  // Main submission handler
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const startTime = performance.now();

    if (DEMO_MODE) {
      // Offline mode: fake 3.6s delay
      await new Promise((resolve) => setTimeout(resolve, 3600));
      const endTime = performance.now();
      const generationTime = ((endTime - startTime) / 1000).toFixed(1);
      
      setResult({
        ...demoData,
        generation_time: generationTime,
        total_commits: 48,
        was_capped: false,
        pr_count: 8
      });
      setLoadingStep(3);
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
        setLoadingStep(3);
      } catch (err) {
        console.error(err);
        setError(err.message || 'An unexpected error occurred during changelog generation.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Copy to clipboard handler
  const handleCopy = () => {
    const textToCopy = activeTab === 'changelog' ? result?.technical_changelog : result?.executive_summary;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Clipboard error:', err));
  };

  // Download markdown file handler
  const handleDownload = () => {
    const textToDownload = activeTab === 'changelog' ? result?.technical_changelog : result?.executive_summary;
    if (!textToDownload) return;

    const filename = activeTab === 'changelog' ? 'CHANGELOG.md' : 'RELEASE_NOTES.md';
    const blob = new Blob([textToDownload], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dot status colors for vertical pipeline
  const getDotClass = (index) => {
    if (isLoading) {
      if (index < loadingStep) return 'bg-[#16A34A]'; // Completed steps turn Green
      if (index === loadingStep) return 'bg-[#2D7EF8] animate-pulse-glow'; // Active pulses Blue
      return 'bg-[#1E2D45]'; // Staged remains dark
    }
    if (result) return 'bg-[#16A34A]'; // All steps complete Green if successful
    return 'bg-[#1E2D45]'; // Idle state
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-[#94A3B8] flex flex-col font-sans antialiased select-none">
      
      {/* 44px Minimal Header */}
      <header className="h-11 bg-[#0A0F1A] border-b border-[#1E2D45] flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[#2D7EF8]" />
          <span className="font-mono text-xs font-bold tracking-[0.15em] text-white">gitnotes</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] text-[#3D5278]">
          <span>v1.0</span>
          <span className="text-[#1E2D45]">•</span>
          <a href="https://github.com/Vijajraj/Gitnotes" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">docs</a>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Pipeline Trace (48px wide) */}
        <aside className="w-12 bg-[#0A0F1A] border-r border-[#1E2D45] flex flex-col items-center py-10 gap-8 relative z-25 shrink-0">
          <div className="absolute top-10 bottom-10 w-[1px] bg-[#1E2D45] -z-10" />
          
          {steps.map((step, idx) => (
            <div key={idx} className="pipeline-node-container relative flex items-center justify-center cursor-help">
              {/* Tooltip */}
              <div className="pipeline-tooltip absolute left-8 bg-[#0D1420] border border-[#1E2D45] font-mono text-[10px] text-white px-2 py-0.5 tracking-wider rounded uppercase z-50">
                {step.label}
              </div>
              
              {/* Dot */}
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${getDotClass(idx)}`} />
            </div>
          ))}
        </aside>

        {/* Configurations & Workspace Layout */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Left Inputs Pane */}
          <section className="w-full md:w-[320px] p-6 border-b md:border-b-0 md:border-r border-[#1E2D45] flex flex-col gap-6 overflow-y-auto shrink-0 z-10">
            <div>
              <h2 className="font-mono text-[10px] font-bold text-[#4A6490] tracking-[0.1em] uppercase mb-1">Source configuration</h2>
              <p className="text-[11px] text-[#3D5278] leading-relaxed">
                Connect to a repository to build release change lists.
              </p>
            </div>

            <div className="space-y-5">
              {/* Repo URL Input */}
              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-semibold text-[#4A6490] uppercase tracking-wider">
                  Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  disabled={isLoading}
                  className="w-full bg-transparent border-b border-[#1E2D45] focus:border-[#2D7EF8] focus:outline-none py-1.5 text-white text-xs placeholder-[#3D5278] transition duration-150"
                />
              </div>

              {/* Tags Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-semibold text-[#4A6490] uppercase tracking-wider">
                    From Tag <span className="text-[9px] text-[#3D5278] lowercase font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={fromTag}
                    onChange={(e) => setFromTag(e.target.value)}
                    placeholder="0.100.0"
                    disabled={isLoading}
                    className="w-full bg-transparent border-b border-[#1E2D45] focus:border-[#2D7EF8] focus:outline-none py-1.5 text-white text-xs placeholder-[#3D5278] transition duration-150"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-semibold text-[#4A6490] uppercase tracking-wider">
                    To Tag <span className="text-[9px] text-[#3D5278] lowercase font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={toTag}
                    onChange={(e) => setToTag(e.target.value)}
                    placeholder="0.101.0"
                    disabled={isLoading}
                    className="w-full bg-transparent border-b border-[#1E2D45] focus:border-[#2D7EF8] focus:outline-none py-1.5 text-white text-xs placeholder-[#3D5278] transition duration-150"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <div className="relative overflow-hidden pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !repoUrl.trim()}
                  className="w-full h-11 bg-[#2D7EF8] hover:bg-[#1A6AE8] text-white text-xs font-semibold tracking-wide transition duration-150 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] select-none relative overflow-hidden"
                >
                  {isLoading ? 'Processing Pipeline...' : 'Generate Release Notes'}
                  {/* Loading Sweep overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/10 -translate-x-full animate-sweep" />
                  )}
                </button>
                {/* Thin loading progress bar */}
                {isLoading && (
                  <div className="h-[2px] bg-[#2D7EF8] w-full absolute bottom-0 left-0 animate-pulse" />
                )}
              </div>

              {/* Real-time Status Log */}
              {isLoading && (
                <div className="font-mono text-[11px] text-[#3D5278] leading-relaxed flex items-center gap-2 mt-1">
                  <span>❯</span>
                  <span className="animate-pulse">{steps[loadingStep].desc}</span>
                </div>
              )}
            </div>

            {/* Ingress cap notice */}
            {result && result.was_capped && (
              <div className="font-mono text-[10px] text-amber-500 bg-amber-955/5 border border-amber-900/30 p-2.5 mt-auto">
                ⚠️ Analyzing latest 30 commits only to prevent context limits.
              </div>
            )}
          </section>

          {/* Right Workspace Pane */}
          <section className="flex-1 flex flex-col p-6 overflow-y-auto z-10 gap-6">
            
            {/* Error State Banner */}
            {error && (
              <div className="border-t border-[#DC2626] border-l-3 border-l-[#DC2626] bg-[#0F0A0A] p-4 flex flex-col gap-2 shrink-0">
                <span className="font-mono text-[11px] font-bold text-[#F87171] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Pipeline Failure
                </span>
                <span className="text-xs text-[#F87171]">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="w-20 mt-2 bg-red-950/30 border border-red-900/50 hover:bg-red-950/60 text-[#F87171] font-mono text-[10px] py-1 transition"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Output Workspace */}
            {result && !isLoading && (
              <div className="flex-1 flex flex-col gap-5">
                
                {/* Tabs switcher header */}
                <div className="flex items-center justify-between border-b border-[#1E2D45] pb-px shrink-0">
                  <div className="flex gap-8">
                    <button
                      onClick={() => setActiveTab('changelog')}
                      className={`font-mono text-[11px] font-bold tracking-[0.15em] pb-3 border-b transition ${
                        activeTab === 'changelog' 
                          ? 'text-white border-[#2D7EF8]' 
                          : 'text-[#3D5278] border-transparent hover:text-zinc-300'
                      }`}
                    >
                      CHANGELOG
                    </button>
                    <button
                      onClick={() => setActiveTab('release-notes')}
                      className={`font-mono text-[11px] font-bold tracking-[0.15em] pb-3 border-b transition ${
                        activeTab === 'release-notes' 
                          ? 'text-white border-[#2D7EF8]' 
                          : 'text-[#3D5278] border-transparent hover:text-zinc-300'
                      }`}
                    >
                      RELEASE NOTES
                    </button>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={handleCopy}
                      className={`h-7 px-3 border font-mono text-[10px] tracking-wide flex items-center gap-1.5 transition rounded-[2px] ${
                        copied 
                          ? 'border-emerald-700 bg-emerald-950/20 text-emerald-400' 
                          : 'border-[#3D5278] hover:border-zinc-400 text-[#94A3B8]'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="h-7 px-3 bg-[#1E2D45] hover:bg-[#2a3e5c] text-white font-mono text-[10px] tracking-wide flex items-center gap-1.5 transition rounded-[2px]"
                    >
                      <Download className="w-3 h-3" />
                      <span>download</span>
                    </button>
                  </div>
                </div>

                {/* Metadata stats details */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-[#3D5278] shrink-0">
                  <span>{result.total_commits} commits</span>
                  <span>·</span>
                  <span>{result.pr_count} PRs</span>
                  <span>·</span>
                  <span>{Object.values(result.categories || {}).flat().length} items</span>
                  <span>·</span>
                  <span>{result.generation_time}s</span>
                </div>

                {/* Custom Category breakdown pills */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  {result.categories?.breaking?.length > 0 && (
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-[#DC2626] text-[#DC2626]">
                      ⚠ {result.categories.breaking.length} breaking
                    </span>
                  )}
                  {result.categories?.features?.length > 0 && (
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-[#16A34A] text-[#16A34A]">
                      ✨ {result.categories.features.length} features
                    </span>
                  )}
                  {result.categories?.fixes?.length > 0 && (
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-[#2D7EF8] text-[#2D7EF8]">
                      🐛 {result.categories.fixes.length} fixes
                    </span>
                  )}
                  {result.categories?.performance?.length > 0 && (
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-[#D97706] text-[#D97706]">
                      ⚡ {result.categories.performance.length} performance
                    </span>
                  )}
                  {result.categories?.chores?.length > 0 && (
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-[#3D5278] text-[#3D5278]">
                      🔧 {result.categories.chores.length} chores
                    </span>
                  )}
                </div>

                {/* Breaking changes alert layout */}
                {result.breaking_detected && (
                  <div className="border-t border-[#DC2626] border-l-3 border-l-[#DC2626] bg-[#0F0A0A] p-4 shrink-0">
                    <span className="font-mono text-[11px] font-bold text-[#F87171] uppercase tracking-wider">
                      ⚠ BREAKING CHANGES DETECTED IN THIS RELEASE
                    </span>
                  </div>
                )}

                {/* Markdown Viewport Area */}
                <div className="flex-1 bg-[#0D1420] border border-[#1E2D45] p-8 relative overflow-y-auto">
                  {/* Repo Watermark */}
                  {repoNameWatermark && (
                    <div className="absolute bottom-4 right-4 font-mono text-[120px] font-black text-[#0F1A2E] leading-none pointer-events-none select-none z-0">
                      {repoNameWatermark.toLowerCase()}
                    </div>
                  )}

                  {/* Render Markdown */}
                  <div className="relative z-10 prose prose-invert max-w-none">
                    <Markdown
                      components={{
                        h2: ({ node, ...props }) => (
                          <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-white border-b border-[#1E2D45] pb-2 mb-4 mt-6" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-[13px] font-semibold text-[#2D7EF8] mt-5 mb-2" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="text-[13px] text-[#94A3B8] leading-[1.6] mb-3" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-5 space-y-1.5 mb-4" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="text-[14px] text-[#94A3B8] leading-[1.7]" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="text-white font-semibold" {...props} />
                        ),
                        hr: ({ node, ...props }) => (
                          <hr className="border-[#1E2D45] my-5" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-[#2D7EF8] pl-4 italic text-[#3D5278] my-3" {...props} />
                        )
                      }}
                    >
                      {activeTab === 'changelog' ? result.technical_changelog : result.executive_summary}
                    </Markdown>
                  </div>
                </div>

              </div>
            )}

            {/* Empty State / Idle display */}
            {!result && !isLoading && !error && (
              <div className="flex-1 border border-dashed border-[#1E2D45] flex items-center justify-center min-h-[400px]">
                <span className="font-mono text-xs text-[#3D5278] tracking-wide uppercase select-none">
                  no significant changes found between these versions
                </span>
              </div>
            )}
            
          </section>
        </main>
      </div>
      
    </div>
  );
}
