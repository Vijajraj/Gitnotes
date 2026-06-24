import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function BreakingBanner({ breakingChanges }) {
  if (!breakingChanges || breakingChanges.length === 0) return null;

  return (
    <div className="bg-[#18181b]/50 border border-red-900 rounded-lg p-5 flex gap-4 items-start shadow-sm">
      <div className="bg-red-950/20 p-2 border border-red-900/50 rounded text-red-500 shrink-0">
        <ShieldAlert className="w-4 h-4" />
      </div>
      <div className="space-y-1.5">
        <h4 className="font-semibold text-red-400 text-xs md:text-sm uppercase tracking-wider flex items-center gap-1.5">
          <span>⚠</span> Breaking Changes Detected in this Release
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Critical breaking updates identified in commit logs:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-zinc-300">
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
