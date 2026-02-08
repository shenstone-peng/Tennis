
// Dynamic Time Warping (DTW) implementation for time series matching
// Used to find optimal alignment between two pose sequences

export interface DTWResult {
  distance: number;
  path: [number, number][];
  normalizedDistance: number;
}

export const dtw = (
  sequenceA: number[][],
  sequenceB: number[][],
  distanceMetric: (a: number[], b: number[]) => number = euclideanDistance
): DTWResult => {
  const n = sequenceA.length;
  const m = sequenceB.length;
  
  // Initialize cost matrix with infinity
  const costMatrix: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(Infinity));
  
  costMatrix[0][0] = 0;
  
  // Fill cost matrix
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = distanceMetric(sequenceA[i - 1], sequenceB[j - 1]);
      costMatrix[i][j] = cost + Math.min(
        costMatrix[i - 1][j],     // insertion
        costMatrix[i][j - 1],     // deletion
        costMatrix[i - 1][j - 1]  // match
      );
    }
  }
  
  // Backtrack to find optimal path
  const path: [number, number][] = [];
  let i = n;
  let j = m;
  
  while (i > 0 || j > 0) {
    path.push([i - 1, j - 1]);
    
    if (i === 0) {
      j--;
    } else if (j === 0) {
      i--;
    } else {
      const minCost = Math.min(
        costMatrix[i - 1][j],
        costMatrix[i][j - 1],
        costMatrix[i - 1][j - 1]
      );
      
      if (minCost === costMatrix[i - 1][j - 1]) {
        i--;
        j--;
      } else if (minCost === costMatrix[i - 1][j]) {
        i--;
      } else {
        j--;
      }
    }
  }
  
  path.reverse();
  
  const distance = costMatrix[n][m];
  const normalizedDistance = distance / Math.max(n, m);
  
  return {
    distance,
    path,
    normalizedDistance
  };
};

export const euclideanDistance = (a: number[], b: number[]): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

export const manhattanDistance = (a: number[], b: number[]): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
};

// Find the time offset from DTW path
export const findOffsetFromPath = (
  path: [number, number][],
  sampleRate: number
): { offset: number; confidence: number } => {
  const offsets: number[] = [];
  
  for (const [i, j] of path) {
    offsets.push(i - j);
  }
  
  // Calculate median offset
  const sortedOffsets = [...offsets].sort((a, b) => a - b);
  const medianOffset = sortedOffsets[Math.floor(sortedOffsets.length / 2)];
  
  // Calculate how consistent the offset is
  const variance = offsets.reduce((sum, offset) => {
    const diff = offset - medianOffset;
    return sum + diff * diff;
  }, 0) / offsets.length;
  
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, 1 - stdDev / 10);
  
  return {
    offset: medianOffset / sampleRate,
    confidence: consistency
  };
};

// FastDTW approximation for longer sequences
export const fastDtw = (
  sequenceA: number[][],
  sequenceB: number[][],
  radius: number = 5
): DTWResult => {
  const minSize = Math.min(sequenceA.length, sequenceB.length);
  
  if (minSize <= radius * 2 + 1) {
    return dtw(sequenceA, sequenceB);
  }
  
  // Downsample
  const downsampleA = downsampleBy2(sequenceA);
  const downsampleB = downsampleBy2(sequenceB);
  
  // Recursive call
  const lowResResult = fastDtw(downsampleA, downsampleB, radius);
  
  // Project path to higher resolution and refine
  const projectedPath = projectPath(lowResResult.path);
  const refinedResult = refineDtw(sequenceA, sequenceB, projectedPath, radius);
  
  return refinedResult;
};

const downsampleBy2 = (sequence: number[][]): number[][] => {
  const result: number[][] = [];
  for (let i = 0; i < sequence.length; i += 2) {
    if (i + 1 < sequence.length) {
      const averaged = sequence[i].map((val, idx) => 
        (val + sequence[i + 1][idx]) / 2
      );
      result.push(averaged);
    } else {
      result.push(sequence[i]);
    }
  }
  return result;
};

const projectPath = (path: [number, number][]): [number, number][] => {
  return path.map(([i, j]) => [i * 2, j * 2]);
};

const refineDtw = (
  sequenceA: number[][],
  sequenceB: number[][],
  window: [number, number][],
  radius: number
): DTWResult => {
  const windowSet = new Set(window.map(([i, j]) => `${i},${j}`));
  
  const n = sequenceA.length;
  const m = sequenceB.length;
  
  const costMatrix: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(Infinity));
  
  costMatrix[0][0] = 0;
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (!windowSet.has(`${i - 1},${j - 1}`)) {
        let inWindow = false;
        for (const [wi, wj] of window) {
          if (Math.abs(i - 1 - wi) <= radius && Math.abs(j - 1 - wj) <= radius) {
            inWindow = true;
            break;
          }
        }
        if (!inWindow) continue;
      }
      
      const cost = euclideanDistance(sequenceA[i - 1], sequenceB[j - 1]);
      costMatrix[i][j] = cost + Math.min(
        costMatrix[i - 1][j],
        costMatrix[i][j - 1],
        costMatrix[i - 1][j - 1]
      );
    }
  }
  
  return dtw(sequenceA, sequenceB);
};
