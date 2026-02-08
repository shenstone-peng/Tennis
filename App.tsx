
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
import { AutoSyncButton } from './components/AutoSyncButton';
import { analyzeFrames } from './services/geminiService';
import { AnalysisResult, ComparisonState, SyncResult } from './types';

const App: React.FC = () => {
  const [userVideo, setUserVideo] = useState<string | null>(null);
  const [proVideo, setProVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [userCurrentTime, setUserCurrentTime] = useState(0);
  const [proCurrentTime, setProCurrentTime] = useState(0);
  const [userDuration, setUserDuration] = useState(0);
  const [proDuration, setProDuration] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisState, setAnalysisState] = useState<ComparisonState>(ComparisonState.IDLE);
  const [globalFrameOffset, setGlobalFrameOffset] = useState(0);
  const [wheelSensitivity, setWheelSensitivity] = useState(1);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncOffset, setSyncOffset] = useState(0);

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const proVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fps = 30;

  const handleUserTimeUpdate = (time: number) => {
    setUserCurrentTime(time);
  };

  const handleProTimeUpdate = (time: number) => {
    setProCurrentTime(time);
  };

  const handleUserLoadedMetadata = (duration: number) => {
    setUserDuration(duration);
  };

  const handleProLoadedMetadata = (duration: number) => {
    setProDuration(duration);
  };

  const handleUserSeek = (time: number) => {
    if (userVideoRef.current) {
      userVideoRef.current.currentTime = time;
    }
    setUserCurrentTime(time);
  };

  const handleProSeek = (time: number) => {
    if (proVideoRef.current) {
      proVideoRef.current.currentTime = time;
    }
    setProCurrentTime(time);
  };

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

  const handleGlobalFrameSeek = (offset: number) => {
    setGlobalFrameOffset(offset);
    const frameTime = offset / fps;

    if (userVideoRef.current) {
      userVideoRef.current.currentTime = Math.max(0, Math.min(frameTime, userDuration));
    }
    if (proVideoRef.current) {
      proVideoRef.current.currentTime = Math.max(0, Math.min(frameTime, proDuration));
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    const step = delta * wheelSensitivity;
    const newOffset = Math.max(0, globalFrameOffset + step);
    handleGlobalFrameSeek(newOffset);
  };

  const handleFrameButtonStep = (direction: 'forward' | 'back') => {
    const delta = direction === 'forward' ? 1 : -1;
    const frameStep = delta * wheelSensitivity / fps;

    if (userVideoRef.current) {
      const newTime = Math.max(0, Math.min(userCurrentTime + frameStep, userDuration));
      userVideoRef.current.currentTime = newTime;
      setUserCurrentTime(newTime);
    }

    if (proVideoRef.current) {
      const newTime = Math.max(0, Math.min(proCurrentTime + frameStep, proDuration));
      proVideoRef.current.currentTime = newTime;
      setProCurrentTime(newTime);
    }

    const newOffset = Math.round((userCurrentTime + frameStep) * fps);
    setGlobalFrameOffset(Math.max(0, newOffset));
  };

  const frameStep = (direction: 'forward' | 'back') => {
    const step = 1 / fps;
    const newUserTime = direction === 'forward'
      ? Math.min(userCurrentTime + step, userDuration)
      : Math.max(userCurrentTime - step, 0);
    const newProTime = direction === 'forward'
      ? Math.min(proCurrentTime + step, proDuration)
      : Math.max(proCurrentTime - step, 0);

    if (userVideoRef.current) userVideoRef.current.currentTime = newUserTime;
    if (proVideoRef.current) proVideoRef.current.currentTime = newProTime;
    setUserCurrentTime(newUserTime);
    setProCurrentTime(newProTime);
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSyncComplete = (offset: number, result: SyncResult) => {
    setSyncOffset(offset);
    setSyncResult(result);

    if (userVideoRef.current && proVideoRef.current) {
      const targetTime = Math.max(0, proVideoRef.current.currentTime - offset);
      userVideoRef.current.currentTime = targetTime;
      setUserCurrentTime(targetTime);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          <VideoUploader
            label="User Action"
            videoSrc={userVideo}
            onUpload={(file) => setUserVideo(URL.createObjectURL(file))}
            onClear={() => setUserVideo(null)}
            accentColor="blue"
            videoRef={userVideoRef}
            onTimeUpdate={handleUserTimeUpdate}
            onSeek={handleUserSeek}
            duration={userDuration}
            onLoadedMetadata={handleUserLoadedMetadata}
          />

          <VideoUploader
            label="Pro Reference"
            videoSrc={proVideo}
            onUpload={(file) => setProVideo(URL.createObjectURL(file))}
            onClear={() => setProVideo(null)}
            accentColor="indigo"
            videoRef={proVideoRef}
            onTimeUpdate={handleProTimeUpdate}
            onSeek={handleProSeek}
            duration={proDuration}
            onLoadedMetadata={handleProLoadedMetadata}
          />

          <div className="hidden">
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-slate-950/90 border border-slate-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-2xl flex flex-col gap-6">

            <div className="flex items-center justify-center gap-4">
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

            <div className="flex-1 w-full flex flex-col gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Frame Control</span>
                <span className="text-xs text-slate-400">Frame #{globalFrameOffset}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleFrameButtonStep('back')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                  title="Step backward"
                >
                  <ChevronLeft size={20} className="text-slate-400" />
                </button>

                <div
                  className="relative flex-1 h-10 bg-slate-800 rounded-lg overflow-hidden select-none"
                  onWheel={handleWheel}
                  title="Scroll to advance/rewind frames"
                >
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-px ${i % 10 === 0 ? 'h-4 bg-slate-400' : i % 5 === 0 ? 'h-3 bg-slate-500' : 'h-2 bg-slate-600'}`}
                      />
                    ))}
                  </div>
                  <div className="absolute left-1/2 top-1 bottom-1 w-0.5 bg-blue-500 transform -translate-x-1/2" />
                </div>

                <button
                  onClick={() => handleFrameButtonStep('forward')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                  title="Step forward"
                >
                  <ChevronRight size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Scroll or click buttons to step through frames</span>
                <span>Sensitivity: {wheelSensitivity}x</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Sensitivity:</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={wheelSensitivity}
                  onChange={(e) => setWheelSensitivity(parseInt(e.target.value))}
                  className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {syncResult && (
              <div className="bg-green-900/30 border border-green-800/50 rounded-xl p-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400 font-medium">Auto Sync Complete</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-300">Offset: {syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(2)}s</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-300">Confidence: {(syncResult.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <AutoSyncButton
                userVideoRef={userVideoRef}
                proVideoRef={proVideoRef}
                userVideoSrc={userVideo}
                proVideoSrc={proVideo}
                onSyncComplete={handleSyncComplete}
              />
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
                {analysisState === ComparisonState.ANALYZING ? 'ANALYZING...' : 'ANALYZE'}
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
                  Analyzed at frame: {userCurrentTime.toFixed(2)}s
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
