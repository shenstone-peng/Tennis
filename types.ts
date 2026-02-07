
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
