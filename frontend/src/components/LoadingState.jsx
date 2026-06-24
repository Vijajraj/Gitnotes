import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = [
  "Fetching commits & merged PRs from GitHub REST API...",
  "Analyzing and filtering commit histories...",
  "Invoking Groq LLaMA 3.1 agent critic loop...",
  "Structuring Technical Changelog and Executive Summary..."
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
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-xl shadow-black/30 flex flex-col items-center justify-center min-h-[350px] animate-pulse-subtle">
      {/* Loading Spinner */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin absolute" style={{ animationDuration: '3s' }} />
      </div>

      {/* Steps List */}
      <div className="w-full max-w-md space-y-4">
        <h3 className="text-center font-medium text-slate-350 text-xs mb-6 uppercase tracking-wider">
          AI Release Notes Generation in Progress
        </h3>
        
        {STEPS.map((step, idx) => {
          const isDone = idx < activeStep;
          const isActive = idx === activeStep;
          
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isDone ? 'text-slate-400' : isActive ? 'text-indigo-400 font-semibold scale-[1.01]' : 'text-slate-600'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0 text-indigo-400" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-800 shrink-0" />
              )}
              <span className="text-sm">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Step Counter Notice */}
      <div className="mt-8 text-xs font-semibold text-slate-400 bg-slate-950/80 border border-slate-850 px-4 py-2.5 rounded-full shadow-inner">
        Step {currentStepNum} of {totalSteps} — Estimated time: ~{estimatedSeconds} seconds
      </div>
    </div>
  );
}
