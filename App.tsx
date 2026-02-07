
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RefreshCcw, 
  LayoutGrid, 
  Layers, 
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { VideoUploader } from './components/VideoUploader';
import { AnalysisPanel } from './components/AnalysisPanel';
import { analyzeFrames } from './services/geminiService';
import { AnalysisResult, ComparisonState } from './types';

const App: React.FC = () => {
  const [userVideo, setUserVideo] = useState<string | null>(null);
  const [proVideo, setProVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisState, setAnalysisState] = useState<ComparisonState>(ComparisonState.IDLE);
  const [syncLocked, setSyncLocked] = useState(true);

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const proVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync Video durations
  useEffect(() => {
    const userDur = userVideoRef.current?.duration || 0;
    const proDur = proVideoRef.current?.duration || 0;
    setDuration(Math.max(userDur, proDur));
  }, [userVideo, proVideo]);

  // Sync Logic
  useEffect(() => {
    if (!syncLocked) return;

    const interval = setInterval(() => {
      if (userVideoRef.current && proVideoRef.current && isPlaying) {
        setCurrentTime(userVideoRef.current.currentTime);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, syncLocked]);

  const togglePlay = () => {
    if (!userVideoRef.current || !proVideoRef.current) return;
    
    if (isPlaying) {
      userVideoRef.current.pause();
      proVideoRef.current.pause();
    } else {
      userVideoRef.current.play();
      proVideoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (userVideoRef.current) userVideoRef.current.currentTime = time;
    if (proVideoRef.current) proVideoRef.current.currentTime = time;
  };

  const frameStep = (direction: 'forward' | 'back') => {
    const fps = 30; // Average
    const step = 1 / fps;
    const newTime = direction === 'forward' 
      ? Math.min(currentTime + step, duration)
      : Math.max(currentTime - step, 0);
    handleSeek(newTime);
  };

  const captureFrame = (video: HTMLVideoElement): string => {
    if (!canvasRef.current) return '';
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleAnalyze = async () => {
    if (!userVideoRef.current || !proVideoRef.current) return;
    
    setIsPlaying(false);
    userVideoRef.current.pause();
    proVideoRef.current.pause();

    setAnalysisState(ComparisonState.ANALYZING);
    
    try {
      const userFrame = captureFrame(userVideoRef.current);
      const proFrame = captureFrame(proVideoRef.current);
      
      const result = await analyzeFrames(userFrame, proFrame);
      setAnalysis(result);
      setAnalysisState(ComparisonState.READY);
    } catch (error) {
      console.error(error);
      setAnalysisState(ComparisonState.IDLE);
      alert("Failed to analyze. Check your API key or video format.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <RefreshCcw className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PRO-MIRROR</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Video Analysis Lab</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
               {[0.25, 0.5, 1, 2].map(speed => (
                 <button 
                  key={speed}
                  onClick={() => {
                    setPlaybackRate(speed);
                    if (userVideoRef.current) userVideoRef.current.playbackRate = speed;
                    if (proVideoRef.current) proVideoRef.current.playbackRate = speed;
                  }}
                  className={`px-3 py-1 text-xs rounded transition-all ${playbackRate === speed ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   {speed}x
                 </button>
               ))}
            </div>
            <button 
              onClick={() => { setProVideo(null); setUserVideo(null); setAnalysis(null); }}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* User Video */}
          <div className="space-y-4">
            <VideoUploader 
              label="User Action"
              videoSrc={userVideo}
              onUpload={(file) => setUserVideo(URL.createObjectURL(file))}
              onClear={() => setUserVideo(null)}
              accentColor="blue"
            />
            {userVideo && (
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50 flex flex-col gap-3">
                 <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                   <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">Source: User</span>
                   <span className="mono">00:00:{currentTime.toFixed(2).padStart(5, '0')}</span>
                 </div>
                 <div className="relative h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-75" 
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                 </div>
              </div>
            )}
          </div>

          {/* Pro Video */}
          <div className="space-y-4">
            <VideoUploader 
              label="Pro Reference"
              videoSrc={proVideo}
              onUpload={(file) => setProVideo(URL.createObjectURL(file))}
              onClear={() => setProVideo(null)}
              accentColor="indigo"
            />
            {proVideo && (
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50 flex flex-col gap-3">
                 <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                   <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase tracking-wider">Source: Pro</span>
                   <span className="mono">00:00:{currentTime.toFixed(2).padStart(5, '0')}</span>
                 </div>
                 <div className="relative h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-indigo-500 transition-all duration-75" 
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                 </div>
              </div>
            )}
          </div>

          {/* Hidden Players for Ref */}
          <div className="hidden">
            <video 
              ref={userVideoRef} 
              src={userVideo || ''} 
              onTimeUpdate={(e) => !syncLocked && setCurrentTime(e.currentTarget.currentTime)}
              playsInline 
              muted
            />
            <video 
              ref={proVideoRef} 
              src={proVideo || ''} 
              playsInline 
              muted
            />
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Master Controls */}
        <div className="sticky bottom-8 z-40">
          <div className="bg-slate-950/90 border border-slate-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-6">
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => frameStep('back')}
                className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                title="Previous Frame"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button 
                onClick={togglePlay}
                disabled={!userVideo || !proVideo}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                  isPlaying 
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/25'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>

              <button 
                onClick={() => frameStep('forward')}
                className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                title="Next Frame"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="flex-1 w-full flex flex-col gap-2">
              <input 
                type="range"
                min={0}
                max={duration || 1}
                step={0.01}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-500 tracking-tighter mono">
                <span>00:00:00</span>
                <span className="text-blue-400">SYNCED PLAYBACK</span>
                <span>00:00:{duration.toFixed(2).padStart(5, '0')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSyncLocked(!syncLocked)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${
                  syncLocked 
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle Synchronized Seeking"
              >
                {syncLocked ? <Layers size={14} /> : <LayoutGrid size={14} />}
                {syncLocked ? 'SYNC ON' : 'SYNC OFF'}
              </button>

              <button 
                onClick={handleAnalyze}
                disabled={!userVideo || !proVideo || analysisState === ComparisonState.ANALYZING}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {analysisState === ComparisonState.ANALYZING ? (
                  <RefreshCcw size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                {analysisState === ComparisonState.ANALYZING ? 'ANALYZING...' : 'SYNC & ANALYZE'}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results Area */}
        <section className="pt-8 border-t border-slate-800/60">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Zap size={20} />
              </div>
              <h2 className="text-2xl font-bold">Pro-Insights</h2>
            </div>
            {analysis && (
               <div className="text-xs text-slate-500 flex items-center gap-2 italic">
                 <Info size={14} />
                 Analyzed at frame: {currentTime.toFixed(2)}s
               </div>
            )}
          </div>
          
          <AnalysisPanel 
            analysis={analysis} 
            loading={analysisState === ComparisonState.ANALYZING} 
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/60 py-8 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Powered by <span className="text-slate-300 font-semibold">Gemini 3 Flash Vision</span>
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-600 uppercase tracking-widest font-bold">Privacy First</span>
            <span className="text-xs text-slate-600 uppercase tracking-widest font-bold">Pro Performance</span>
            <span className="text-xs text-slate-600 uppercase tracking-widest font-bold">Biomechanics</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
