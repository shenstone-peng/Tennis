
import React from 'react';
import { BrainCircuit, CheckCircle2, ChevronRight, Loader2, Target } from 'lucide-react';
import { AnalysisResult } from '../types';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  loading: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold">Gemini is analyzing your form...</h3>
        <p className="text-slate-400 text-sm mt-2">Comparing frame-by-frame kinematics</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <BrainCircuit className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-medium text-slate-400">No active analysis</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">
          Select a specific point in time on both videos and click "Sync & Analyze" to get AI-powered insights.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Target size={20} />
            </div>
            <h3 className="text-lg font-bold">Kinematic Comparison</h3>
          </div>
          <p className="text-slate-300 leading-relaxed italic">
            "{analysis.comparison}"
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-lg font-bold">Key Performance Indicators</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.keyDifferences.map((diff, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <ChevronRight size={16} className="text-blue-500 mt-1 shrink-0" />
                <span className="text-sm text-slate-300">{diff}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-indigo-900/40 border border-indigo-800/50 rounded-2xl p-6 shadow-xl h-full">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="p-2 bg-indigo-500 rounded-lg text-white">
              <BrainCircuit size={18} />
            </span>
            Coach's Tips
          </h3>
          <ul className="space-y-4">
            {analysis.tips.map((tip, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-indigo-100 leading-snug bg-white/5 p-4 rounded-xl">
                <span className="font-bold text-indigo-400">{idx + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
