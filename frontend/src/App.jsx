import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { demoData, DEMO_MODE } from './demoData';

/* === UTILITIES === */

// Extracts owner/repo from GitHub URL for header display
const getRepoDisplay = (url) => {
  try {
    const clean = url.trim().replace(/\/+$/, '');
    const parts = clean.split('/');
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }
    return url;
  } catch {
    return url;
  }
};

// Extracts repo name for subtle background watermark
const getRepoWatermark = (url) => {
  try {
    const clean = url.trim().replace(/\/+$/, '');
    const parts = clean.split('/');
    if (parts.length > 0) {
      return parts[parts.length - 1].replace('.git', '');
    }
    return '';
  } catch {
    return '';
  }
};

export default function App() {
  /* === STATE & EFFECTS === */
  const [theme, setTheme] = useState('light'); // 'dark' | 'light' | 'system'
  const [repoUrl, setRepoUrl] = useState('https://github.com/fastapi/fastapi');
  const [fromTag, setFromTag] = useState('0.100.0');
  const [toTag, setToTag] = useState('0.101.0');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('changelog'); // 'changelog' | 'release-notes'
  const [pipelineStep, setPipelineStep] = useState(0); // 0 | 1 | 2 | 3
  const [copied, setCopied] = useState(false);
  const [generationTime, setGenerationTime] = useState(0.0);

  // Sync theme with document attribute and handle system media query changes
  useEffect(() => {
    const applyTheme = () => {
      let resolvedTheme = theme;
      if (theme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Clean copied state timer
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  /* === HANDLERS === */

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setPipelineStep(0);

    const startTime = performance.now();

    // Trace status intervals simulation during request run
    const stepInterval = setInterval(() => {
      setPipelineStep((prev) => {
        if (prev < 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    if (DEMO_MODE) {
      // Fake 3.5s loading behavior in offline demo configuration
      await new Promise((resolve) => setTimeout(resolve, 3500));
      clearInterval(stepInterval);
      setPipelineStep(3);
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      setGenerationTime(parseFloat(duration));
      setResult(demoData);
      setLoading(false);
    } else {
      try {
        const response = await fetch('http://localhost:8000/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_url: repoUrl,
            from_tag: fromTag ? fromTag.trim() : null,
            to_tag: toTag ? toTag.trim() : null,
          }),
        });

        clearInterval(stepInterval);

        if (!response.ok) {
          const detail = await response.json();
          throw new Error(detail.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        setPipelineStep(3);
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        setGenerationTime(parseFloat(duration));
        setResult(data);
      } catch (err) {
        setError(err.message || 'An unexpected error occurred during changelog generation.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = () => {
    const textToCopy = activeTab === 'changelog' ? result?.technical_changelog : result?.executive_summary;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy)
      .then(() => setCopied(true))
      .catch((err) => console.error('Clipboard copy failed:', err));
  };

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
    URL.revokeObjectURL(url);
  };

  // Helper mapping pipeline step index to circle class styles
  const getPipelineCircleClass = (stepIndex) => {
    if (loading) {
      if (pipelineStep > stepIndex) {
        return 'border-[var(--success)] bg-[var(--success)]';
      }
      if (pipelineStep === stepIndex) {
        return 'border-[var(--accent)] bg-[var(--accent)] animate-active-pulse';
      }
      return 'border-[var(--border)] bg-transparent';
    }
    if (result) {
      return 'border-[var(--success)] bg-[var(--success)]';
    }
    return 'border-[var(--border)] bg-transparent';
  };

  // Helper checking if category list has populated contents
  const hasResultCategories = result?.categories && 
    Object.values(result.categories).some((arr) => Array.isArray(arr) && arr.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-secondary)] select-none">
      
      {/* === TOP BAR === */}
      <header className="h-[52px] border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)] text-[16px] font-bold">◈</span>
          <span className="text-[var(--text-primary)] font-semibold text-[15px] tracking-tight">GitNotes</span>
          <span className="text-[var(--text-muted)] text-[11px] font-mono ml-2">v1.0</span>
        </div>

        {/* Theme select switch */}
        <div className="flex items-center bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-full p-[2px] select-none">
          <button
            onClick={() => setTheme('light')}
            className={`w-[28px] h-[28px] flex items-center justify-center rounded-full text-xs font-semibold cursor-pointer transition-all duration-150 ${theme === 'light' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="Light Mode (☀)"
          >
            ☀
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`w-[28px] h-[28px] flex items-center justify-center rounded-full text-xs font-semibold cursor-pointer transition-all duration-150 ${theme === 'system' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="System Sync (◑)"
          >
            ◑
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`w-[28px] h-[28px] flex items-center justify-center rounded-full text-xs font-semibold cursor-pointer transition-all duration-150 ${theme === 'dark' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="Dark Mode (☾)"
          >
            ☾
          </button>
        </div>
      </header>

      {/* === WORKSPACE SPLIT === */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* === LEFT SIDEBAR === */}
        <aside className="w-[320px] bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col p-6 overflow-y-auto shrink-0 select-text">
          
          {/* Section: SOURCE CONFIGURATION */}
          <div className="mb-6">
            <h2 className="font-mono text-[10px] font-bold tracking-[0.1em] text-[var(--text-muted)] uppercase mb-1">
              SOURCE CONFIGURATION
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Connect a repository to analyze commits and generate release documentation
            </p>
            <div className="h-[1px] bg-[var(--border)] mt-4"></div>
          </div>

          {/* Configuration Inputs */}
          <div className="space-y-4">
            
            {/* Repository URL Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                Repository URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                disabled={loading}
                className="w-full h-9 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md px-3 font-mono text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(91,108,249,0.15)] transition duration-150 disabled:opacity-50"
              />
            </div>

            {/* Tag Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                  FROM TAG
                </label>
                <input
                  type="text"
                  value={fromTag}
                  onChange={(e) => setFromTag(e.target.value)}
                  placeholder="0.100.0"
                  disabled={loading}
                  className="w-full h-9 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md px-3 font-mono text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(91,108,249,0.15)] transition duration-150 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                  TO TAG
                </label>
                <input
                  type="text"
                  value={toTag}
                  onChange={(e) => setToTag(e.target.value)}
                  placeholder="0.101.0"
                  disabled={loading}
                  className="w-full h-9 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md px-3 font-mono text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(91,108,249,0.15)] transition duration-150 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !repoUrl.trim()}
              className={`w-full h-9 rounded-md text-[13px] font-medium tracking-wide text-white select-none transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${loading ? 'animate-shimmer' : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'}`}
            >
              {loading ? 'Generating...' : 'Generate Release Notes'}
            </button>

            {/* Ingress cap alert (for large live repository requests) */}
            {result && result.was_capped && (
              <div className="border border-[var(--warning)] bg-[rgba(245,158,11,0.05)] rounded p-3 text-[11px] text-[var(--warning)] font-mono">
                ⚠️ Capped ingestion to the latest 30 commits to bypass limits.
              </div>
            )}

            {/* Section: PIPELINE TRACE */}
            <div className="pt-4 border-t border-[var(--border)] select-none">
              <h3 className="font-mono text-[10px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase mb-4">
                PIPELINE
              </h3>

              <div className="relative pl-1 space-y-0">
                {/* Step 0: Fetch */}
                <div className="flex items-center gap-3">
                  <div className={`w-[8px] h-[8px] rounded-full border-[1.5px] transition-all duration-300 ${getPipelineCircleClass(0)}`} />
                  <span className={`text-[12px] ${loading && pipelineStep === 0 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>
                    Fetch commits
                  </span>
                </div>
                <div className="w-[1px] h-[20px] border-l border-dashed border-[var(--border)] ml-[3.5px] my-1" />

                {/* Step 1: Analyze */}
                <div className="flex items-center gap-3">
                  <div className={`w-[8px] h-[8px] rounded-full border-[1.5px] transition-all duration-300 ${getPipelineCircleClass(1)}`} />
                  <span className={`text-[12px] ${loading && pipelineStep === 1 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>
                    Analyze changes
                  </span>
                </div>
                <div className="w-[1px] h-[20px] border-l border-dashed border-[var(--border)] ml-[3.5px] my-1" />

                {/* Step 2: Generate */}
                <div className="flex items-center gap-3">
                  <div className={`w-[8px] h-[8px] rounded-full border-[1.5px] transition-all duration-300 ${getPipelineCircleClass(2)}`} />
                  <span className={`text-[12px] ${loading && pipelineStep === 2 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>
                    Generate docs
                  </span>
                </div>
                <div className="w-[1px] h-[20px] border-l border-dashed border-[var(--border)] ml-[3.5px] my-1" />

                {/* Step 3: Complete */}
                <div className="flex items-center gap-3">
                  <div className={`w-[8px] h-[8px] rounded-full border-[1.5px] transition-all duration-300 ${getPipelineCircleClass(3)}`} />
                  <span className={`text-[12px] ${result && !loading ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>
                    Complete
                  </span>
                </div>
              </div>

            </div>

          </div>
        </aside>

        {/* === RIGHT PANEL === */}
        <main className="flex-1 bg-[var(--bg-primary)] p-8 overflow-y-auto flex flex-col select-text relative">
          
          {/* Watermark Logo Label in Background */}
          {!loading && result && getRepoWatermark(repoUrl) && (
            <div className="absolute bottom-6 right-6 font-mono text-[90px] font-black text-[var(--bg-secondary)] leading-none tracking-tighter uppercase select-none pointer-events-none opacity-40 z-0">
              {getRepoWatermark(repoUrl)}
            </div>
          )}

          {/* ERROR STATUS BANNER */}
          {error && (
            <div className="border border-[var(--danger)] bg-[rgba(239,68,68,0.04)] rounded-lg p-4 mb-6 flex items-center justify-between shrink-0 z-10">
              <div className="flex flex-col">
                <span className="font-mono text-xs font-bold text-[var(--danger)] uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ Pipeline Failure
                </span>
                <span className="text-xs text-[var(--text-secondary)] mt-1">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded px-2.5 py-1 bg-[var(--bg-tertiary)] hover:border-[var(--text-secondary)] transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* IDLE STATE */}
          {!loading && !result && (
            <div className="flex-1 flex flex-col items-center justify-center text-center select-none z-10">
              <span className="text-[var(--border)] text-[48px] font-bold leading-none mb-3">◈</span>
              <h3 className="text-[var(--text-primary)] text-sm font-semibold mb-1">
                No release notes generated
              </h3>
              <p className="text-[var(--text-secondary)] text-[12px] max-w-[280px]">
                Enter a repository URL and version tags to get started
              </p>
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center select-none z-10">
              <div className="flex gap-1.5 text-[var(--text-muted)] text-[32px] font-bold mb-3">
                <span className="dot-1">.</span>
                <span className="dot-2">.</span>
                <span className="dot-3">.</span>
              </div>
              <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-widest font-semibold">
                {pipelineStep === 0 && 'fetching commits...'}
                {pipelineStep === 1 && 'analyzing commits...'}
                {pipelineStep === 2 && 'generating release notes...'}
                {pipelineStep === 3 && 'finalizing format...'}
              </span>
            </div>
          )}

          {/* OUTPUT RESULT STATE */}
          {!loading && result && (
            <div className="flex-1 flex flex-col z-10">
              
              {/* TOP HEADER ROW */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-4 gap-4 shrink-0">
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-[var(--text-primary)]">
                    {getRepoDisplay(repoUrl)}
                  </span>
                  <span className="font-mono text-[12px] text-[var(--text-secondary)] mt-0.5">
                    {fromTag ? fromTag : 'Latest'} → {toTag ? toTag : 'Latest'}
                  </span>
                </div>

                {/* Metadata stats pills */}
                <div className="flex items-center gap-2 select-none">
                  <span className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-0.5 text-[11px] font-mono text-[var(--text-secondary)]">
                    {result.total_commits || 0} commits
                  </span>
                  <span className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-0.5 text-[11px] font-mono text-[var(--text-secondary)]">
                    {result.pr_count || 0} PRs
                  </span>
                  <span className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-0.5 text-[11px] font-mono text-[var(--text-secondary)]">
                    {generationTime}s
                  </span>
                </div>
              </div>

              {/* BREAKING CHANGES WARNING ALERT */}
              {result.breaking_detected && (
                <div className="w-full bg-[rgba(239,68,68,0.08)] border-l-[3px] border-[var(--danger)] rounded-r-md px-3.5 py-2.5 mt-4 flex items-center gap-2 shrink-0">
                  <span className="text-[var(--danger)] text-sm font-semibold select-none">⚠</span>
                  <span className="text-[13px] text-[var(--danger)] font-medium">
                    Breaking changes detected — review before upgrading
                  </span>
                </div>
              )}

              {/* CATEGORY SUMMARY PILLS ROW */}
              {hasResultCategories && (
                <div className="flex flex-wrap gap-2 mt-4 shrink-0 select-none">
                  {result.categories?.breaking?.length > 0 && (
                    <span className="border border-[var(--danger)] text-[var(--danger)] rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                      {result.categories.breaking.length} Breaking
                    </span>
                  )}
                  {result.categories?.features?.length > 0 && (
                    <span className="border border-[var(--success)] text-[var(--success)] rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                      {result.categories.features.length} Features
                    </span>
                  )}
                  {result.categories?.fixes?.length > 0 && (
                    <span className="border border-[var(--accent)] text-[var(--accent)] rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                      {result.categories.fixes.length} Fixes
                    </span>
                  )}
                  {result.categories?.performance?.length > 0 && (
                    <span className="border border-[var(--warning)] text-[var(--warning)] rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                      {result.categories.performance.length} Performance
                    </span>
                  )}
                  {result.categories?.chores?.length > 0 && (
                    <span className="border border-[var(--text-muted)] text-[var(--text-muted)] rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                      {result.categories.chores.length} Chores
                    </span>
                  )}
                </div>
              )}

              {/* TABS & COPIES ACTIONS HEADER */}
              <div className="flex items-center justify-between border-b border-[var(--border)] mt-6 pb-px shrink-0 select-none">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab('changelog')}
                    className={`text-[13px] font-medium pb-2 border-b-2 transition cursor-pointer ${activeTab === 'changelog' ? 'text-[var(--text-primary)] border-[var(--accent)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'}`}
                  >
                    Changelog
                  </button>
                  <button
                    onClick={() => setActiveTab('release-notes')}
                    className={`text-[13px] font-medium pb-2 border-b-2 transition cursor-pointer ${activeTab === 'release-notes' ? 'text-[var(--text-primary)] border-[var(--accent)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'}`}
                  >
                    Release Notes
                  </button>
                </div>

                {/* Tab actions buttons */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={handleCopy}
                    className={`h-7 px-3 flex items-center justify-center font-mono text-[12px] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[5px] cursor-pointer transition select-none ${copied ? 'text-[var(--success)] border-[var(--success)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'}`}
                  >
                    {copied ? (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        ✓ Copied
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="h-7 px-3 flex items-center justify-center font-mono text-[12px] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] cursor-pointer transition select-none"
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download
                    </span>
                  </button>
                </div>
              </div>

              {/* OUTPUT CONTAINER AREA */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 mt-4 relative">
                
                {/* Empty check */}
                {!hasResultCategories && (
                  <div className="flex items-center justify-center py-10 select-none">
                    <span className="font-mono text-[12px] text-[var(--text-muted)] uppercase tracking-wider text-center">
                      no significant changes between these versions
                    </span>
                  </div>
                )}

                {/* Render markdown documentation */}
                {hasResultCategories && (
                  <div className="prose max-w-none">
                    <Markdown
                      components={{
                        h2: ({ node, ...props }) => (
                          <h2 className="text-[13px] font-mono uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] pb-2 mt-6 mb-3" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-[13px] font-semibold text-[var(--accent)] mt-4 mb-2" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6] mb-3" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-5 mb-4 space-y-1.5" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal pl-5 mb-4 space-y-1.5" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="text-[13px] text-[var(--text-secondary)] leading-[1.8]" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="text-[var(--text-primary)] font-semibold" {...props} />
                        ),
                        code: ({ node, ...props }) => (
                          <code className="font-mono bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-[3px] px-[5px] py-[1px] text-[12px]" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-[var(--accent)] pl-4 italic text-[var(--text-muted)] my-3" {...props} />
                        )
                      }}
                    >
                      {activeTab === 'changelog' ? result.technical_changelog : result.executive_summary}
                    </Markdown>
                  </div>
                )}

              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
