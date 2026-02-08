
import type { Keypoint, Pose, PoseFeature } from '../types';

let detector: any = null;

declare global {
  interface Window {
    tf: any;
    poseDetection: any;
  }
}

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

export const initializePoseDetector = async (): Promise<void> => {
  if (detector) return;

  if (!window.tf) {
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
  }
  if (!window.poseDetection) {
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js');
  }

  const tf = window.tf;
  const poseDetection = window.poseDetection;

  await tf.setBackend('webgl');
  await tf.ready();

  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    minPoseScore: 0.3
  };

  detector = await poseDetection.createDetector(model, detectorConfig);
};

export const detectPose = async (video: HTMLVideoElement): Promise<Pose | null> => {
  if (!detector) {
    await initializePoseDetector();
  }

  if (!detector) return null;

  try {
    const poses = await detector.estimatePoses(video);
    if (poses.length > 0 && poses[0].score && poses[0].score > 0.3) {
      return {
        keypoints: poses[0].keypoints.map((kp: any) => ({
          x: kp.x,
          y: kp.y,
          score: kp.score || 0,
          name: kp.name || ''
        })),
        score: poses[0].score
      };
    }
    return null;
  } catch (error) {
    console.error('Pose detection error:', error);
    return null;
  }
};

export const calculateAngle = (
  p1: Keypoint,
  p2: Keypoint,
  p3: Keypoint
): number => {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) -
                  Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
};

export const extractFeatures = (pose: Pose, timestamp: number): PoseFeature | null => {
  const kps = pose.keypoints;

  // MoveNet keypoint indices:
  // 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear
  // 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow
  // 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip
  // 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle

  const requiredIndices = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const hasAllKeypoints = requiredIndices.every(i => kps[i] && kps[i].score > 0.3);

  if (!hasAllKeypoints) return null;

  return {
    leftElbow: calculateAngle(kps[5], kps[7], kps[9]),
    rightElbow: calculateAngle(kps[6], kps[8], kps[10]),
    leftKnee: calculateAngle(kps[11], kps[13], kps[15]),
    rightKnee: calculateAngle(kps[12], kps[14], kps[16]),
    leftShoulder: calculateAngle(kps[7], kps[5], kps[11]),
    rightShoulder: calculateAngle(kps[8], kps[6], kps[12]),
    leftHip: calculateAngle(kps[5], kps[11], kps[13]),
    rightHip: calculateAngle(kps[6], kps[12], kps[14]),
    leftWrist: kps[9].y,
    rightWrist: kps[10].y,
    timestamp
  };
};

export const featureToVector = (feature: PoseFeature): number[] => {
  return [
    feature.leftElbow,
    feature.rightElbow,
    feature.leftKnee,
    feature.rightKnee,
    feature.leftShoulder,
    feature.rightShoulder,
    feature.leftHip,
    feature.rightHip,
    feature.leftWrist,
    feature.rightWrist
  ];
};

export const drawPose = (
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  scaleX: number = 1,
  scaleY: number = 1
): void => {
  const kps = pose.keypoints;

  ctx.fillStyle = '#3b82f6';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;

  kps.forEach(kp => {
    if (kp.score > 0.3) {
      ctx.beginPath();
      ctx.arc(kp.x * scaleX, kp.y * scaleY, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  const connections = [
    [5, 7], [7, 9],
    [6, 8], [8, 10],
    [5, 6],
    [5, 11], [6, 12],
    [11, 12],
    [11, 13], [13, 15],
    [12, 14], [14, 16]
  ];

  connections.forEach(([i, j]) => {
    if (kps[i].score > 0.3 && kps[j].score > 0.3) {
      ctx.beginPath();
      ctx.moveTo(kps[i].x * scaleX, kps[i].y * scaleY);
      ctx.lineTo(kps[j].x * scaleX, kps[j].y * scaleY);
      ctx.stroke();
    }
  });
};

export const disposeDetector = (): void => {
  if (detector) {
    detector.dispose();
    detector = null;
  }
};
