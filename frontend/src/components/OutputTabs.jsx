import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { FileCode, FileText, ListFilter, ShieldAlert, BadgeCheck, Wrench, Zap, Copy, Check } from 'lucide-react';

export default function OutputTabs({ result }) {
  const [activeTab, setActiveTab] = useState('technical'); // 'technical', 'executive', 'categorized'
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!result) return null;

  const categoriesData = result.categories || {};
  const categoriesList = [
    { key: 'breaking', label: 'Breaking Changes', icon: ShieldAlert, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { key: 'features', label: 'Features', icon: BadgeCheck, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { key: 'fixes', label: 'Fixes', icon: Wrench, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { key: 'performance', label: 'Performance', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { key: 'chores', label: 'Chores & Internal', icon: ListFilter, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
  ];

  // Check if categories are empty (all noise filtered)
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

  return (
    <div className="space-y-6">
      
      {/* Switcher & Clipboard Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
        <div className="flex border border-slate-850 p-1 bg-slate-900/40 rounded-xl max-w-lg">
          <button
            onClick={() => setActiveTab('technical')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'technical'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-455 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Technical Changelog</span>
          </button>
          
          <button
            onClick={() => setActiveTab('executive')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'executive'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-455 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Executive Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('categorized')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'categorized'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-455 hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Categorized Log</span>
          </button>
        </div>

        {activeTab !== 'categorized' && !isEmpty && (
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold border transition-all active:scale-[0.98] ${
              copied
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-350 hover:text-white hover:border-slate-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>
        )}
      </div>

      {/* Main Panel Content */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-inner shadow-black/20">
        
        {isEmpty ? (
          <div className="text-center py-10 flex flex-col items-center justify-center min-h-[200px]">
            <p className="text-slate-300 font-semibold text-sm md:text-base mb-1.5">
              No significant changes found between these versions.
            </p>
            <p className="text-slate-500 text-xs md:text-sm">
              Try a wider tag range.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'technical' && (
              <div className="prose prose-invert max-w-none text-slate-350">
                <Markdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight border-b border-slate-800 pb-3 mb-6" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-bold text-slate-100 mt-8 mb-4 border-b border-slate-900 pb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base md:text-lg font-semibold text-indigo-400 mt-6 mb-3 uppercase tracking-wide" {...props} />,
                    p: ({node, ...props}) => <p className="leading-relaxed mb-4 text-sm md:text-base text-slate-300" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2 text-sm md:text-base text-slate-300" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      return inline ? (
                        <code className="bg-slate-950 px-1.5 py-0.5 rounded text-xs text-indigo-300 font-mono border border-slate-900" {...props}>{children}</code>
                      ) : (
                        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 overflow-x-auto text-xs text-indigo-200 font-mono mb-4"><code {...props}>{children}</code></pre>
                      )
                    },
                    blockquote: ({node, children, ...props}) => (
                      <blockquote className="border-l-4 border-slate-700 pl-4 py-1 italic text-slate-400 my-4" {...props}>{children}</blockquote>
                    )
                  }}
                >
                  {result.technical_changelog}
                </Markdown>
              </div>
            )}

            {activeTab === 'executive' && (
              <div className="prose prose-invert max-w-none text-slate-350">
                <Markdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight border-b border-slate-800 pb-3 mb-6" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-bold text-slate-100 mt-8 mb-4 border-b border-slate-900 pb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base md:text-lg font-semibold text-violet-400 mt-6 mb-3 border-l-2 border-violet-500 pl-3" {...props} />,
                    p: ({node, ...props}) => <p className="leading-relaxed mb-4 text-sm md:text-base text-slate-350" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2 text-sm md:text-base text-slate-300" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      return inline ? (
                        <code className="bg-slate-950 px-1.5 py-0.5 rounded text-xs text-violet-300 font-mono" {...props}>{children}</code>
                      ) : (
                        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 overflow-x-auto text-xs text-violet-200 font-mono mb-4"><code {...props}>{children}</code></pre>
                      )
                    },
                    blockquote: ({node, children, ...props}) => {
                      return (
                        <div className="my-5 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 text-amber-200 text-sm italic">
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
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-2">Change Matrix Summary</h3>
                <div className="grid grid-cols-1 gap-6">
                  {categoriesList.map(({ key, label, icon: Icon, color }) => {
                    const list = categoriesData[key] || [];
                    if (list.length === 0 && key !== 'breaking') return null;
                    
                    return (
                      <div key={key} className={`border rounded-xl p-5 ${color}`}>
                        <div className="flex items-center gap-2 mb-3.5">
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold text-sm uppercase tracking-wider">{label}</span>
                          <span className="text-xs bg-black/20 rounded-full px-2 py-0.5 font-mono ml-auto">
                            {list.length} {list.length === 1 ? 'change' : 'changes'}
                          </span>
                        </div>
                        {list.length === 0 ? (
                          <p className="text-xs italic opacity-60">No modifications detected in this category.</p>
                        ) : (
                          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-slate-300">
                            {list.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Category Breakdown Chart (Pure Tailwind) */}
      {!isEmpty && result.categories && (
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 space-y-5">
          <h4 className="text-xs font-semibold text-slate-450 uppercase tracking-widest">
            📊 Change Distribution Chart
          </h4>
          <div className="space-y-4">
            {categoriesList.map(({ key, label }) => {
              const count = (categoriesData[key] || []).length;
              const maxCount = Math.max(...categoriesList.map(item => (categoriesData[item.key] || []).length), 1);
              const percent = (count / maxCount) * 100;
              
              // Map categories to exactly red/green/blue/yellow/gray
              const barColor = 
                key === 'breaking' ? 'bg-rose-500' :      // Red
                key === 'features' ? 'bg-emerald-500' :   // Green
                key === 'fixes' ? 'bg-sky-500' :          // Blue
                key === 'performance' ? 'bg-amber-500' :   // Yellow
                'bg-slate-500';                           // Gray
                
              return (
                <div key={key} className="flex items-center gap-4 text-xs">
                  <span className="w-32 text-slate-400 font-medium truncate">{label}</span>
                  <div className="flex-1 bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-900 relative">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-700`}
                      style={{ width: count > 0 ? `${percent}%` : '0%' }}
                    />
                  </div>
                  <span className="w-6 text-right font-mono text-slate-300 font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clipboard Floating Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-[9999] bg-emerald-600 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/10 border border-emerald-500/35 flex items-center gap-2.5 transition-all duration-300 ${
          showToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
        }`}
      >
        <Check className="w-5 h-5 text-white shrink-0" />
        <span>Copied to clipboard!</span>
      </div>

    </div>
  );
}
