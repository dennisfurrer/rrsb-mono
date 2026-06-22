import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/**
 * Full-screen in-app camera QR scanner. Decodes frames client-side via jsQR so
 * the phone never has to leave the installed PWA to use a separate camera app.
 */
export function QrScanner({
  onResult,
  onCancel,
}: {
  onResult: (text: string) => void;
  onCancel?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        tick();
      } catch {
        setError("Kein Kamerazugriff möglich. Bitte Kamera-Berechtigung erlauben.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || doneRef.current) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w > 0 && h > 0) {
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(video, 0, 0, w, h);
          const frame = ctx.getImageData(0, 0, w, h);
          const code = jsQR(frame.data, w, h);
          if (code && code.data) {
            doneRef.current = true;
            stop();
            onResult(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    function stop() {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    void start();
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {error ? (
        <div style={{ color: "#fff", textAlign: "center", padding: "0 28px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 40 }}>🚫</div>
          <div style={{ fontSize: 16 }}>{error}</div>
        </div>
      ) : (
        <>
          <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div
            style={{
              position: "absolute",
              width: "min(70vw, 280px)",
              height: "min(70vw, 280px)",
              border: "3px solid #fff",
              borderRadius: 16,
              boxShadow: "0 0 0 2000px rgba(0,0,0,0.45)",
            }}
          />
          <div style={{ position: "absolute", top: "max(20px, env(safe-area-inset-top))", color: "#fff", fontSize: 15, background: "rgba(0,0,0,0.5)", padding: "8px 16px", borderRadius: 10 }}>
            QR-Code auf dem Scoreboard-Bildschirm scannen
          </div>
        </>
      )}
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            position: "absolute",
            bottom: "max(24px, env(safe-area-inset-bottom))",
            minWidth: 160,
            minHeight: 48,
            borderRadius: 12,
            border: "1px solid #444",
            background: "#1c1c22",
            color: "#eee",
            fontSize: 15,
          }}
        >
          Abbrechen
        </button>
      )}
    </div>
  );
}
