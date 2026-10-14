import React, { useEffect, useState, useRef } from 'react';
import { animate } from 'animejs';
import { Sparkles, ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';

interface StepLoaderProps {
  toolName?: string;
}

export default function StepLoader({ toolName = 'Tool' }: StepLoaderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ringRef.current) {
      try {
        animate(ringRef.current, {
          rotate: [0, 360],
          duration: 1800,
          loop: true,
          ease: 'linear'
        });
      } catch (err) {
        console.warn('Ring animation error:', err);
      }
    }

    const t1 = setTimeout(() => setCurrentStep(2), 120);
    const t2 = setTimeout(() => setCurrentStep(3), 260);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const steps = [
    { num: 1, label: 'Allocating sandbox memory' },
    { num: 2, label: `Streaming ${toolName} engine` },
    { num: 3, label: 'Initializing GPU canvas pipeline' }
  ];

  return (
    <div className="min-h-[460px] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Animated glowing center rings */}
      <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
        {/* Pulsing outer aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-pulse-ring blur-lg" />

        {/* Spinning gradient ring */}
        <div
          ref={ringRef}
          className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-600 via-violet-500 to-pink-500 shadow-lg shadow-indigo-300"
        >
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
            <Sparkles size={28} className="text-indigo-600 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span>Loading {toolName}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Low RAM Mode
          </span>
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Step-by-step modular loading to prevent browser memory exhaustion.
        </p>
      </div>

      {/* Stepped progress indicators */}
      <div className="w-full max-w-xs mt-6 space-y-2">
        {steps.map((st) => {
          const isDone = currentStep > st.num;
          const isCurrent = currentStep === st.num;
          return (
            <div
              key={st.num}
              className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                  : isCurrent
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                  : 'bg-slate-50/50 border-slate-100 text-slate-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? <CheckCircle2 size={12} /> : st.num}
              </div>
              <span className="truncate">{st.label}</span>
            </div>
          );
        })}
      </div>

      {/* Memory badge */}
      <div className="mt-8 flex items-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
        <Cpu size={13} className="text-indigo-500" />
        <span>Hardware accelerated client processing</span>
      </div>
    </div>
  );
}
