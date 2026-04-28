/** A single point in normalized (0–1) coordinate space. */
export interface Point {
  x: number;
  y: number;
}

/** One freehand drawing stroke. */
export interface Stroke {
  points: Point[];
  color: string;
  size: number;
  eraser: boolean;
}

/** One text overlay item. */
export interface TextItem {
  id: string;
  text: string;
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  fontSize: number; // in image-space pixels
  color: string;
  bold: boolean;
}
