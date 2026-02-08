
import React, { useState } from 'react';
import { RefreshCcw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { performAutoSync, AnalysisProgress } from '../services/videoAnalyzer';
import type { SyncResult } from '../types';

interface AutoSyncButtonProps {
  userVideoRef: React.RefObject<HTMLVideoElement>;
  proVideoRef: React.RefObject<HTMLVideoElement>;
  userVideoSrc: string | null;
  proVideoSrc: string | null;
  onSyncComplete: (offset: number, result: SyncResult) => void;
  disabled?: boolean;
}

export const AutoSyncButton: React.FC<AutoSyncButtonProps> = ({
  userVideoRef,
  proVideoRef,
  userVideoSrc,
  proVideoSrc,
  onSyncComplete,
  disabled
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAutoSync = async () => {
    const userVideo = userVideoRef.current;
    const proVideo = proVideoRef.current;

    if (!userVideo || !proVideo) {
      setError('Both videos must be loaded');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccess(false);
    setProgress({ stage: 'initializing', progress: 0, message: 'Initializing...' });

    try {
      const result = await performAutoSync(
        userVideo,
        proVideo,
        (p) => setProgress(p)
      );

      const offset = result.offset;
      
      if (userVideoRef.current && proVideoRef.current) {
        const newTime = Math.max(0, proVideoRef.current.currentTime - offset);
        userVideoRef.current.currentTime = newTime;
      }

      onSyncComplete(offset, result);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  const canSync = userVideoSrc && proVideoSrc && !isAnalyzing && !disabled;

  if (isAnalyzing) {
    return (
      <div className="px-6 py-3 bg-slate-800 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <RefreshCcw size={18} className="text-blue-400 animate-spin" />
          <span className="text-sm font-medium">{progress?.message || 'Analyzing...'}</span>
        </div>
        <div className="w-48 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress?.progress || 0}%` }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleAutoSync}
          disabled={!canSync}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Sparkles size={18} />
          AUTO SYNC
        </button>
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <button
        className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2"
      >
        <CheckCircle2 size={18} />
        SYNCED!
      </button>
    );
  }

  return (
    <button
      onClick={handleAutoSync}
      disabled={!canSync}
      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
    >
      <Sparkles size={18} />
      AUTO SYNC
    </button>
  );
};
