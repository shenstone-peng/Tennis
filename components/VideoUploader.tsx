
import React, { useRef } from 'react';
import { Upload, Video, X } from 'lucide-react';

interface VideoUploaderProps {
  label: string;
  videoSrc: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  accentColor?: string;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  label, 
  videoSrc, 
  onUpload, 
  onClear,
  accentColor = "blue"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  if (videoSrc) {
    return (
      <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
        <video src={videoSrc} className="w-full h-full object-contain" muted />
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
