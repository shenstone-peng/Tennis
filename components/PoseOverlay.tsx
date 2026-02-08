
import React, { useEffect, useRef, useState } from 'react';
import { detectPose, drawPose } from '../services/poseDetectionService';
import type { Pose } from '../types';

interface PoseOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
}

export const PoseOverlay: React.FC<PoseOverlayProps> = ({ videoRef, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const detectAndDraw = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || video.paused || video.ended) {
        animationRef.current = requestAnimationFrame(detectAndDraw);
        return;
      }

      const detectedPose = await detectPose(video);
      setPose(detectedPose);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (detectedPose) {
          const scaleX = canvas.width / video.videoWidth;
          const scaleY = canvas.height / video.videoHeight;
          drawPose(ctx, detectedPose, scaleX, scaleY);
        }
      }

      animationRef.current = requestAnimationFrame(detectAndDraw);
    };

    detectAndDraw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, videoRef]);

  useEffect(() => {
    const handleResize = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) {
        const rect = video.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [videoRef]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
