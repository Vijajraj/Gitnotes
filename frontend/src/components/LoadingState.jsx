import React, { useEffect, useState } from 'react';
import { Terminal, Check, Loader2 } from 'lucide-react';

const STEPS = [
  "🔍 Ingesting repository commit history...",
  "🧠 Processing through Agentic Critic Loop...",
  "📝 Compiling technical changelog markdown...",
  "✨ Structural validation verified. Rendering assets..."
];

export default function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < STEPS.length - 1) {
        currentStep++;
        setActiveStep(currentStep);
      } else {
        clearInterval(interval);
      }
    }, 900);
    
    return () => clearInterval(interval);
  }, []);

  const totalSteps = STEPS.length;
  const currentStepNum = activeStep + 1;
  const estimatedSeconds = Math.max(1, totalSteps - activeStep);

  return (
    <div className="bg-black border border-zinc-850 rounded-lg p-6 font-mono text-xs shadow-md space-y-5 text-zinc-400">
      
      {/* Terminal Title Bar */}
      <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3">
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest ml-2 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span>GitNotes Terminal</span>
        </span>
      </div>

      {/* Progressing Steps */}
      <div className="space-y-3.5 py-2">
        {STEPS.map((step, idx) => {
          const isDone = idx < activeStep;
          const isActive = idx === activeStep;
          
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 transition-colors duration-300 ${
                isDone 
                  ? 'text-zinc-500' 
                  : isActive 
                    ? 'text-zinc-100 font-semibold' 
                    : 'text-zinc-700'
              }`}
            >
              {isDone ? (
                <span className="text-emerald-500 shrink-0 select-none">✓</span>
              ) : isActive ? (
                <span className="text-zinc-400 shrink-0 animate-pulse select-none">❯</span>
              ) : (
                <span className="text-zinc-800 shrink-0 select-none">·</span>
              )}
              <span>{step}</span>
            </div>
          );
        })}
      </div>

      {/* Terminal Info Footer */}
      <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-[10px] text-zinc-500 uppercase tracking-wider">
        <span>Step {currentStepNum} of {totalSteps}</span>
        <span>Estimated: ~{estimatedSeconds}s</span>
      </div>
    </div>
  );
}
