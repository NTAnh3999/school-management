"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Lazily registers the <model-viewer> custom element on first use —
// @google/model-viewer is a non-trivial Web Component library (Lit + a
// glTF rendering runtime) most lessons never touch.
let modelViewerReadyPromise: Promise<void> | undefined;
function loadModelViewer(): Promise<void> {
  if (!modelViewerReadyPromise) {
    modelViewerReadyPromise = import("@google/model-viewer").then(() => undefined);
  }
  return modelViewerReadyPromise;
}

function useModelViewerReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadModelViewer().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return ready;
}

interface Model3DViewerProps {
  src: string;
  alt: string;
  height?: number;
}

export function Model3DViewer({ src, alt, height = 420 }: Model3DViewerProps) {
  const ready = useModelViewerReady();

  if (!ready) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      auto-rotate
      className="rounded-2xl bg-surface-container-low"
      style={{ width: "100%", height }}
    />
  );
}
