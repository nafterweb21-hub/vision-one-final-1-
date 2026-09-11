"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function CameraScanner({
  onScan,
  onClose,
}: {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    // Use a small delay to bypass React 18 Strict Mode's immediate mount-unmount-mount cycle.
    // This prevents creating duplicate video elements and the play() AbortError.
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;

      html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (isStopping) return;
          setIsStopping(true);
          if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              onScanRef.current(decodedText);
            }).catch(console.error);
          } else {
            onScanRef.current(decodedText);
          }
        },
        (err) => {}
      ).catch((err) => {
        // Ignore errors if we're unmounting
        if (isMounted) {
          console.error("Camera start error:", err);
          import("react-hot-toast").then((module) => {
            module.toast.error("Camera access denied or unavailable.");
          });
          onClose();
        }
      });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      
      // If React unmounts us forcibly without the button, try to stop gracefully
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []); // Remove dependencies so it only starts once on mount

  const handleClose = () => {
    if (isStopping) return;
    setIsStopping(true);
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        onClose();
      }).catch((e) => {
        console.error(e);
        onClose();
      });
    } else {
      onClose();
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-black rounded-2xl overflow-hidden p-2">
      <div id="qr-reader" className="w-full h-full overflow-hidden flex items-center justify-center" />
      <button 
        onClick={handleClose}
        disabled={isStopping}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-white text-rose-600 border-2 border-rose-100 hover:bg-rose-50 rounded-full shadow-lg text-sm font-bold transition-all disabled:opacity-50 z-10"
      >
        {isStopping ? "Closing..." : "Close Camera"}
      </button>
    </div>
  );
}
