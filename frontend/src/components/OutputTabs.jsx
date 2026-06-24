import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Copy, Check, Download, FileCode, FileText, ListFilter, ShieldAlert, BadgeCheck, Wrench, Zap } from 'lucide-react';

export default function OutputTabs({ result }) {
  const [activeTab, setActiveTab] = useState('technical'); // 'technical', 'executive', 'categorized'
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!result) return null;

  const categoriesData = result.categories || {};
  const categoriesList = [
    { key: 'breaking', label: 'Breaking Changes', icon: ShieldAlert, color: 'text-red-400 bg-red-950/10 border-red-900/25' },
    { key: 'features', label: 'Features', icon: BadgeCheck, color: 'text-zinc-100 bg-zinc-900/30 border-zinc-800/80' },
    { key: 'fixes', label: 'Fixes', icon: Wrench, color: 'text-zinc-300 bg-zinc-900/30 border-zinc-800/80' },
    { key: 'performance', label: 'Performance', icon: Zap, color: 'text-amber-400 bg-amber-950/10 border-amber-900/25' },
    { key: 'chores', label: 'Chores & Internal', icon: ListFilter, color: 'text-zinc-400 bg-zinc-900/30 border-zinc-800/80' }
  ];

  const totalChangesCount = Object.values(categoriesData).reduce((sum, list) => sum + (list ? list.length : 0), 0);
  const isEmpty = totalChangesCount === 0;

  const handleCopy = () => {
    const textToCopy = activeTab === 'technical' ? result.technical_changelog : result.executive_summary;
    if (!textToCopy) return;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowToast(false), 2500);
    });
  };

  const handleDownload = () => {
    const content = activeTab === 'technical' ? result.technical_changelog : result.executive_summary;
    if (!content) return;
    
    const verClean = activeTab === 'technical' ? 'CHANGELOG' : 'release-notes';
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${verClean}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      
      {/* Vercel/Linear Segmented Tabs Switcher & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-3">
        <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-md">
          <button
            onClick={() => setActiveTab('technical')}
            className={`flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold rounded transition-all ${
              activeTab === 'technical'
                ? 'bg-zinc-900 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Technical Changelog</span>
          </button>
          
          <button
            onClick={() => setActiveTab('executive')}
            className={`flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold rounded transition-all ${
              activeTab === 'executive'
                ? 'bg-zinc-900 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('categorized')}
            className={`flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold rounded transition-all ${
              activeTab === 'categorized'
                ? 'bg-zinc-900 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Categorized Log</span>
          </button>
        </div>

        {activeTab !== 'categorized' && !isEmpty && (
          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              title="Copy to Clipboard"
              className={`p-2 rounded border transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              title="Download Markdown File"
              className="p-2 rounded border bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Content Container */}
      <div className="bg-black border border-zinc-850 rounded-lg p-6 md:p-8 shadow-sm">
        
        {isEmpty ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <p className="text-zinc-300 font-semibold text-xs md:text-sm uppercase tracking-wide mb-1">
              No significant changes found
            </p>
            <p className="text-zinc-650 text-[11px]">
              Try adjusting your tag comparison range.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'technical' && (
              <div className="prose prose-invert max-w-none text-zinc-300 text-xs md:text-sm">
                <Markdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-lg md:text-xl font-bold text-white border-b border-zinc-900 pb-2 mb-4 uppercase tracking-wider" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-sm md:text-base font-bold text-zinc-200 mt-6 mb-3 border-b border-zinc-950 pb-1" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xs font-semibold text-zinc-400 mt-4 mb-2 uppercase tracking-widest" {...props} />,
                    p: ({node, ...props}) => <p className="leading-relaxed mb-3 text-zinc-400" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-zinc-400" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      return inline ? (
                        <code className="bg-zinc-950 px-1 py-0.5 rounded text-[11px] text-zinc-300 font-mono border border-zinc-900" {...props}>{children}</code>
                      ) : (
                        <pre className="bg-zinc-950 p-4 rounded border border-zinc-900 overflow-x-auto text-[11px] text-zinc-400 font-mono mb-3"><code {...props}>{children}</code></pre>
                      )
                    },
                    blockquote: ({node, children, ...props}) => (
                      <blockquote className="border-l-2 border-zinc-700 pl-3 py-0.5 italic text-zinc-500 my-3" {...props}>{children}</blockquote>
                    )
                  }}
                >
                  {result.technical_changelog}
                </Markdown>
              </div>
            )}

            {activeTab === 'executive' && (
              <div className="prose prose-invert max-w-none text-zinc-300 text-xs md:text-sm">
                <Markdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-lg md:text-xl font-bold text-white border-b border-zinc-900 pb-2 mb-4 uppercase tracking-wider" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-sm md:text-base font-bold text-zinc-200 mt-6 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xs font-semibold text-zinc-400 mt-4 mb-2 border-l border-zinc-700 pl-2" {...props} />,
                    p: ({node, ...props}) => <p className="leading-relaxed mb-3 text-zinc-400" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-zinc-400" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      return inline ? (
                        <code className="bg-zinc-950 px-1 py-0.5 rounded text-[11px] text-zinc-300 font-mono" {...props}>{children}</code>
                      ) : (
                        <pre className="bg-zinc-950 p-4 rounded border border-zinc-900 overflow-x-auto text-[11px] text-zinc-400 font-mono mb-3"><code {...props}>{children}</code></pre>
                      )
                    },
                    blockquote: ({node, children, ...props}) => {
                      return (
                        <div className="my-4 bg-zinc-900/30 border border-zinc-800 rounded p-3.5 text-zinc-400 text-xs italic">
                          {children}
                        </div>
                      );
                    }
                  }}
                >
                  {result.executive_summary}
                </Markdown>
              </div>
            )}

            {activeTab === 'categorized' && (
              <div className="space-y-4">
                {categoriesList.map(({ key, label, icon: Icon, color }) => {
                  const list = categoriesData[key] || [];
                  if (list.length === 0 && key !== 'breaking') return null;
                  
                  return (
                    <div key={key} className={`border rounded p-4 ${color}`}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Icon className="w-4 h-4 text-zinc-400" />
                        <span className="font-semibold text-xs uppercase tracking-wider">{label}</span>
                        <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 rounded px-1.5 py-0.5 font-mono ml-auto">
                          {list.length}
                        </span>
                      </div>
                      {list.length === 0 ? (
                        <p className="text-[11px] italic text-zinc-600">No modifications recorded.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-400 leading-relaxed">
                          {list.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Category Breakdown Chart (Pure Tailwind v4 Minimalist) */}
      {!isEmpty && result.categories && (
        <div className="bg-black border border-zinc-850 rounded-lg p-5 space-y-4">
          <h4 className="text-[10px] font-semibold text-zinc-550 uppercase tracking-widest">
            📊 Distribution Metrics
          </h4>
          <div className="space-y-3 text-xs">
            {categoriesList.map(({ key, label }) => {
              const count = (categoriesData[key] || []).length;
              const maxCount = Math.max(...categoriesList.map(item => (categoriesData[item.key] || []).length), 1);
              const percent = (count / maxCount) * 100;
              
              const barColor = 
                key === 'breaking' ? 'bg-red-600' :
                key === 'features' ? 'bg-zinc-200' :
                key === 'fixes' ? 'bg-zinc-400' :
                key === 'performance' ? 'bg-zinc-500' :
                'bg-zinc-700';
                
              return (
                <div key={key} className="flex items-center gap-4">
                  <span className="w-28 text-zinc-400 font-medium truncate text-[11px]">{label}</span>
                  <div className="flex-1 bg-zinc-950 rounded h-2 overflow-hidden border border-zinc-900">
                    <div
                      className={`h-full ${barColor} transition-all duration-700`}
                      style={{ width: count > 0 ? `${percent}%` : '0%' }}
                    />
                  </div>
                  <span className="w-6 text-right font-mono text-zinc-400 font-semibold text-[11px]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hyper-Minimal Floating Clipboard Toast */}
      <div
        className={`fixed bottom-6 right-6 z-[9999] bg-zinc-900 text-zinc-150 font-semibold px-4 py-3 rounded border border-zinc-800 shadow-md flex items-center gap-2 transition-all duration-300 ${
          showToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-[11px] font-mono">Copied to clipboard!</span>
      </div>

    </div>
  );
}
