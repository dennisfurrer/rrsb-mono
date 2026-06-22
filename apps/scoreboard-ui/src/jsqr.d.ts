declare module "jsqr" {
  interface QRCode {
    data: string;
    binaryData: number[];
    location: Record<string, { x: number; y: number }>;
  }
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): QRCode | null;
}
