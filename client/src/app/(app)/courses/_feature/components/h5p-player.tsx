"use client";

import { Component, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Lazily loads h5p-standalone on first use — frame.bundle.js alone is a
// non-trivial third-party runtime (~140KB minified) most lessons never
// touch, so it's deferred behind first render rather than paid for on every
// page load.
let h5pStandaloneReadyPromise: Promise<typeof import("h5p-standalone")> | undefined;
function loadH5pStandalone(): Promise<typeof import("h5p-standalone")> {
  if (!h5pStandaloneReadyPromise) {
    h5pStandaloneReadyPromise = import("h5p-standalone");
  }
  return h5pStandaloneReadyPromise;
}

// Fixed, stable path to h5p-standalone's own player runtime assets
// (frame.bundle.js, h5p.css), copied once from node_modules/h5p-standalone
// into client/public/h5p-player/ (same pair admin-portal uses). These are
// the same two files for every H5P render — NOT per-upload content, unlike
// h5pJsonPath below which points at one specific extracted .h5p package.
const H5P_PLAYER_FRAME_JS = "/h5p-player/frame.bundle.js";
const H5P_PLAYER_FRAME_CSS = "/h5p-player/styles/h5p.css";

interface H5pErrorBoundaryState {
  hasError: boolean;
}

// h5p-standalone doesn't fail gracefully when the uploaded package is
// missing a declared content-type library — it throws an uncaught
// TypeError from its own jQuery-based init code, outside the Promise chain
// `new H5P(...)` returns, which would otherwise crash the whole React tree.
class H5pErrorBoundary extends Component<{ children: ReactNode }, H5pErrorBoundaryState> {
  state: H5pErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): H5pErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("H5P player crashed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="text-sm text-muted-foreground">
          Failed to load this interactive package.
        </p>
      );
    }
    return this.props.children;
  }
}

interface H5pPlayerInnerProps {
  h5pJsonPath: string;
  height: number;
}

function H5pPlayerInner({ h5pJsonPath, height }: H5pPlayerInnerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    loadH5pStandalone()
      .then(({ H5P }) => {
        if (cancelled || !containerRef.current) return;
        return new H5P(containerRef.current, {
          h5pJsonPath,
          frameJs: H5P_PLAYER_FRAME_JS,
          frameCss: H5P_PLAYER_FRAME_CSS,
        });
      })
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load H5P content", err);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [h5pJsonPath]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {status === "error" && (
        <p className="text-sm text-muted-foreground">
          Failed to load this interactive package.
        </p>
      )}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", display: status === "ready" ? "block" : "none" }}
      />
    </div>
  );
}

export function H5pPlayer(props: H5pPlayerInnerProps) {
  return (
    <H5pErrorBoundary>
      <H5pPlayerInner {...props} />
    </H5pErrorBoundary>
  );
}
