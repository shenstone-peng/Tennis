
import React, { useRef, RefObject, useState, useEffect } from 'react';
import { Upload, Video, X } from 'lucide-react';

interface VideoUploaderProps {
  label: string;
  videoSrc: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  accentColor?: string;
  videoRef?: RefObject<HTMLVideoElement>;
  onTimeUpdate?: (time: number) => void;
  duration?: number;
  onSeek?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  label,
  videoSrc,
  onUpload,
  onClear,
  accentColor = "blue",
  videoRef,
  onTimeUpdate,
  duration = 0,
  onSeek,
  onLoadedMetadata
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const actualVideoRef = videoRef || internalVideoRef;
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    const video = actualVideoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
      onLoadedMetadata?.(video.duration);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [videoSrc, onLoadedMetadata]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const time = e.currentTarget.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    onSeek?.(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  if (videoSrc) {
    const effectiveDuration = duration || videoDuration;
    return (
      <div className="space-y-3">
        <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
          <video
            ref={actualVideoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            muted
            playsInline
            onTimeUpdate={handleTimeUpdate}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button 
              onClick={() => onClear()}
              className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
          <div className="absolute bottom-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-${accentColor}-500 text-white shadow-md`}>
              {label}
            </span>
          </div>
        </div>
        <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className={`bg-${accentColor}-500/10 text-${accentColor}-400 px-2 py-0.5 rounded uppercase tracking-wider`}>Source: {label}</span>
            <span className="mono">{formatTime(currentTime)} / {formatTime(effectiveDuration)}</span>
          </div>
          <input 
            type="range"
            min={0}
            max={effectiveDuration || 1}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className={`w-full aspect-video rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-${accentColor}-500/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group`}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleFileChange} 
        accept="video/*" 
        className="hidden" 
      />
      <div className={`p-4 rounded-full bg-slate-900 group-hover:bg-${accentColor}-500/20 group-hover:text-${accentColor}-400 transition-colors`}>
        <Upload size={32} className="text-slate-400 group-hover:text-inherit" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-300">Upload {label} Video</p>
        <p className="text-xs text-slate-500 mt-1">MP4, WEBM, or MOV supported</p>
      </div>
    </div>
  );
};
