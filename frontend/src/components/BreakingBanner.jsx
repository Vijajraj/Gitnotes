import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function BreakingBanner({ breakingChanges }) {
  if (!breakingChanges || breakingChanges.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4 items-start shadow-lg shadow-amber-500/5 animate-fade-in">
      <div className="bg-amber-500/20 p-2 rounded-xl text-amber-400 shrink-0">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1.5">
        <h4 className="font-semibold text-amber-200 text-sm md:text-base">
          Breaking Changes Detected in this Release
        </h4>
        <p className="text-xs md:text-sm text-slate-350 text-slate-350 leading-relaxed">
          The LLaMA agent flagged critical breaking changes that require engineering attention:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-xs md:text-sm text-slate-300">
          {breakingChanges.map((change, idx) => (
            <li key={idx} className="leading-relaxed">
              {change}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
