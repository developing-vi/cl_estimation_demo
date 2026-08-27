export interface PredictionResponse {
  internal_os: [number, number];
  external_os: [number, number];
  cl_pixels: number;
  mask: number[][]; // 256 x 256 binary array
  note: string;
}
