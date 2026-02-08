
import { detectPose, extractFeatures, featureToVector, initializePoseDetector } from './poseDetectionService';
import type { PoseFeature, SyncResult } from '../types';

const SAMPLE_RATE = 10; // Sample 10 frames per second
const MIN_VIDEO_DURATION = 2; // Minimum 2 seconds
const MAX_VIDEO_DURATION = 30; // Maximum 30 seconds for analysis

export interface AnalysisProgress {
  stage: 'initializing' | 'sampling' | 'analyzing' | 'matching';
  progress: number;
  message: string;
}

export const analyzeVideo = async (
  video: HTMLVideoElement,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<PoseFeature[]> => {
  if (video.duration < MIN_VIDEO_DURATION) {
    throw new Error(`Video too short. Minimum ${MIN_VIDEO_DURATION}s required.`);
  }
  
  onProgress?.({ stage: 'initializing', progress: 0, message: 'Loading pose detection model...' });
  await initializePoseDetector();
  
  onProgress?.({ stage: 'sampling', progress: 0, message: 'Sampling video frames...' });
  
  const duration = Math.min(video.duration, MAX_VIDEO_DURATION);
  const features: PoseFeature[] = [];
  const sampleInterval = 1 / SAMPLE_RATE;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  
  const originalTime = video.currentTime;
  video.pause();
  
  for (let i = 0; i < totalSamples; i++) {
    const timestamp = i * sampleInterval;
    video.currentTime = timestamp;
    
    await new Promise<void>(resolve => {
      const handleSeeked = () => {
        video.removeEventListener('seeked', handleSeeked);
        resolve();
      };
      video.addEventListener('seeked', handleSeeked, { once: true });
      
      setTimeout(() => {
        video.removeEventListener('seeked', handleSeeked);
        resolve();
      }, 100);
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const pose = await detectPose(video);
    if (pose) {
      const feature = extractFeatures(pose, timestamp);
      if (feature) {
        features.push(feature);
      }
    }
    
    const progress = ((i + 1) / totalSamples) * 100;
    onProgress?.({ 
      stage: 'sampling', 
      progress, 
      message: `Analyzed frame ${i + 1}/${totalSamples}` 
    });
  }
  
  video.currentTime = originalTime;
  
  if (features.length < 10) {
    throw new Error('Could not detect enough poses. Please ensure the athlete is clearly visible.');
  }
  
  return features;
};

export const findBestSyncOffset = (
  userFeatures: PoseFeature[],
  proFeatures: PoseFeature[]
): { offset: number; confidence: number; matchScore: number } => {
  const userVectors = userFeatures.map(f => featureToVector(f));
  const proVectors = proFeatures.map(f => featureToVector(f));
  
  let bestOffset = 0;
  let bestScore = -Infinity;
  
  const maxOffset = Math.floor(userFeatures.length * 0.8);
  const minOffset = -Math.floor(proFeatures.length * 0.8);
  
  for (let offset = minOffset; offset <= maxOffset; offset++) {
    let totalScore = 0;
    let validComparisons = 0;
    
    for (let i = 0; i < proVectors.length; i++) {
      const userIdx = i + offset;
      if (userIdx >= 0 && userIdx < userVectors.length) {
        const similarity = cosineSimilarity(userVectors[userIdx], proVectors[i]);
        totalScore += similarity;
        validComparisons++;
      }
    }
    
    if (validComparisons > 0) {
      const avgScore = totalScore / validComparisons;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestOffset = offset;
      }
    }
  }
  
  const timeOffset = bestOffset / SAMPLE_RATE;
  const confidence = Math.min(1, (bestScore + 1) / 2);
  
  return {
    offset: timeOffset,
    confidence,
    matchScore: bestScore
  };
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const performAutoSync = async (
  userVideo: HTMLVideoElement,
  proVideo: HTMLVideoElement,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<SyncResult> => {
  onProgress?.({ stage: 'analyzing', progress: 0, message: 'Analyzing user video...' });
  const userFeatures = await analyzeVideo(userVideo, (p) => {
    if (p.stage === 'sampling') {
      onProgress?.({ ...p, progress: p.progress * 0.5 });
    }
  });
  
  onProgress?.({ stage: 'analyzing', progress: 50, message: 'Analyzing professional video...' });
  const proFeatures = await analyzeVideo(proVideo, (p) => {
    if (p.stage === 'sampling') {
      onProgress?.({ ...p, progress: 50 + p.progress * 0.5 });
    }
  });
  
  onProgress?.({ stage: 'matching', progress: 90, message: 'Finding best sync point...' });
  const { offset, confidence, matchScore } = findBestSyncOffset(userFeatures, proFeatures);
  
  const matchQuality = Math.max(0, (matchScore + 1) / 2);
  
  return {
    offset,
    confidence,
    matchQuality,
    userFeatures,
    proFeatures
  };
};
