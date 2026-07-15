// v95: OpenCV.js for Computer Vision — Floor plan image analysis
// Loaded dynamically from CDN to avoid bundle size impact
// Provides: edge detection, line detection, contour finding for auto-wall detection

import { useState, useCallback, useRef } from "react";

const OPENCV_CDN_URL = "https://cdn.jsdelivr.net/npm/opencvjs@1.0.1/opencv.min.js";

let cvLoaded = false;
let cvLoadPromise: Promise<void> | null = null;

export function getOpenCVScriptUrl(): string | null {
  const configuredUrl = import.meta.env.VITE_OPENCV_URL;
  if (configuredUrl) return configuredUrl;
  if (import.meta.env.VITE_ENABLE_OPENCV_CDN === "true") return OPENCV_CDN_URL;
  return null;
}

export function isOpenCVConfigured(): boolean {
  return getOpenCVScriptUrl() !== null;
}

export function loadOpenCV(): Promise<void> {
  if (cvLoaded) return Promise.resolve();
  if (cvLoadPromise) return cvLoadPromise;

  const scriptUrl = getOpenCVScriptUrl();
  if (!scriptUrl) {
    return Promise.reject(
      new Error("OpenCV no configurado para modo offline. Configure VITE_OPENCV_URL o VITE_ENABLE_OPENCV_CDN=true."),
    );
  }

  cvLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      cvLoaded = true;
      resolve();
    };
    script.onerror = () => {
      cvLoadPromise = null;
      reject(new Error("Failed to load OpenCV.js"));
    };
    document.head.appendChild(script);
  });

  return cvLoadPromise;
}

export interface WallDetection {
  lines: Array<{ x1: number; y1: number; x2: number; y2: number; length: number }>;
  contours: Array<{ points: Array<{ x: number; y: number }>; area: number }>;
  rooms: Array<{ x: number; y: number; width: number; height: number; confidence: number }>;
}

export function useOpenCV() {
  const [isLoaded, setIsLoaded] = useState(cvLoaded);
  const [isProcessing, setIsProcessing] = useState(false);
  const cvRef = useRef<any>(null);

  const load = useCallback(async () => {
    if (cvLoaded) { setIsLoaded(true); return; }
    await loadOpenCV();
    cvRef.current = (window as any).cv;
    setIsLoaded(true);
  }, []);

  // Detect walls in a floor plan image using Canny + Hough
  const detectWalls = useCallback(async (imageSrc: string): Promise<WallDetection | null> => {
    if (!isLoaded && !cvLoaded) await load();
    const cv = cvRef.current || (window as any).cv;
    if (!cv) return null;

    setIsProcessing(true);
    try {
      // Load image
      const img = await loadImage(imageSrc);
      const src = cv.imread(img);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Gaussian blur to reduce noise
      const blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Canny edge detection
      const edges = new cv.Mat();
      cv.Canny(blurred, edges, 50, 150, 3);

      // Hough Line Transform — detect straight lines (walls)
      const lines = new cv.Mat();
      cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 50, 10);

      const detectedLines: WallDetection["lines"] = [];
      for (let i = 0; i < lines.rows; i++) {
        const [x1, y1, x2, y2] = [lines.data32S[i * 4], lines.data32S[i * 4 + 1], lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]];
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        if (length > 30) detectedLines.push({ x1, y1, x2, y2, length: Math.round(length) });
      }

      // Find contours (rooms)
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(edges.clone(), contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

      const detectedContours: WallDetection["contours"] = [];
      const detectedRooms: WallDetection["rooms"] = [];

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        if (area > 500) {
          const points: Array<{ x: number; y: number }> = [];
          const data = contour.data32S;
          for (let j = 0; j < data.length; j += 2) {
            points.push({ x: data[j], y: data[j + 1] });
          }
          detectedContours.push({ points, area: Math.round(area) });

          // Bounding rectangle as potential room
          const rect = cv.boundingRect(contour);
          if (rect.width > 50 && rect.height > 50) {
            detectedRooms.push({
              x: rect.x, y: rect.y,
              width: rect.width, height: rect.height,
              confidence: Math.min(0.95, area / (rect.width * rect.height)),
            });
          }
        }
        contour.delete();
      }

      // Cleanup
      src.delete(); gray.delete(); blurred.delete(); edges.delete();
      lines.delete(); contours.delete(); hierarchy.delete();

      return { lines: detectedLines, contours: detectedContours, rooms: detectedRooms };
    } catch (err) {
      console.error("[OpenCV] Wall detection failed:", err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isLoaded, load]);

  return { isLoaded, isProcessing, load, detectWalls };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
