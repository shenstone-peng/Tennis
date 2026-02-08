
export interface AnalysisResult {
  comparison: string;
  tips: string[];
  keyDifferences: string[];
}

export enum ComparisonState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ANALYZING = 'ANALYZING',
  READY = 'READY'
}

export interface VideoMetadata {
  duration: number;
  fps: number;
  width: number;
  height: number;
}

export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score: number;
}

export interface PoseFeature {
  leftElbow: number;
  rightElbow: number;
  leftKnee: number;
  rightKnee: number;
  leftShoulder: number;
  rightShoulder: number;
  leftHip: number;
  rightHip: number;
  leftWrist: number;
  rightWrist: number;
  timestamp: number;
}

export interface SyncResult {
  offset: number;
  confidence: number;
  matchQuality: number;
  userFeatures: PoseFeature[];
  proFeatures: PoseFeature[];
}
