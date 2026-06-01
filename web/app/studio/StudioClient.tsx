"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BouncingRingCanvas } from "@/components/BouncingRingCanvas";
import { CustomizePanel } from "@/components/CustomizePanel";
import { PayModal } from "@/components/PayModal";
import { downloadGif, type GifExportResult } from "@/lib/gifExport";
import { generateColorScheme } from "@/lib/simulation/colors";
import { computeRenderId } from "@/lib/renderId";
import { isUnlocked, requestUnlock } from "@/lib/paywall";
import {
  defaultStudioConfig,
  normalizeStudioConfig,
  buildPhysicsDefaults,
  type StudioConfig,
} from "@/lib/simulation/types";

export function StudioClient() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<StudioConfig>(() => defaultStudioConfig());
  const [generating, setGenerating] = useState(false);
  const [gifExport, setGifExport] = useState<GifExportResult | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const renderId = useMemo(() => computeRenderId(config), [config]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;
    void (async () => {
      const res = await requestUnlock(renderId, sessionId);
      if (res.unlocked) setStatus("Payment verified — you can download.");
      else setStatus(res.message ?? "Payment pending.");
    })();
  }, [searchParams, renderId]);

  useEffect(() => {
    // Client-side initialization of a random scheme on mount
    handleRandomize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRandomize = () => {
    const baseHue = Math.random();
    setConfig((c) =>
      normalizeStudioConfig({
        ...c,
        baseHue,
        ballHue: (baseHue + 0.5) % 1,
        seed: Math.floor(Math.random() * 1e9),
      }),
    );
  };

  const handleResetPhysics = () => {
    setConfig((c) =>
      normalizeStudioConfig({
        ...c,
        ...buildPhysicsDefaults(),
      }),
    );
  };

  const handleGenerate = () => {
    if (generating) return;
    const baseHue = Math.random();
    setConfig((c) =>
      normalizeStudioConfig({
        ...c,
        baseHue,
        ballHue: (baseHue + 0.5) % 1,
        seed: Math.floor(Math.random() * 1e9),
      }),
    );
    setGifExport(null);
    setStatus(`Recording ${config.targetTime}s…`);
    setGenerating(true);
  };

  const handleRecordingComplete = useCallback((result: GifExportResult) => {
    setGifExport(result);
    setStatus(`Ready — ${result.frameCount} frames encoded.`);
  }, []);

  const runDownload = useCallback(() => {
    if (!gifExport?.bytes.length) return;
    try {
      const scheme = generateColorScheme(config.baseHue, config.ballHue);
      downloadGif(gifExport.bytes, scheme.ball);
      setStatus("GIF downloaded.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Export failed.");
    }
  }, [gifExport, config.baseHue, config.ballHue]);

  const handleDownloadClick = async () => {
    if (!gifExport?.bytes.length) {
      setStatus("Generate an animation first.");
      return;
    }
    if (isUnlocked(renderId)) {
      runDownload();
      return;
    }
    setPayOpen(true);
  };

  const handleUnlock = async () => {
    setPayLoading(true);
    setPayError(null);
    const res = await requestUnlock(renderId);
    setPayLoading(false);
    if (res.unlocked) {
      setPayOpen(false);
      runDownload();
      return;
    }
    setPayError(res.message ?? "Payment required.");
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-sm text-violet-400 hover:text-violet-300">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold">Studio</h1>
          <span className="text-xs text-zinc-500">Preview free · Pay to download</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 p-4 lg:grid-cols-[minmax(300px,360px)_1fr]">
        <CustomizePanel
          config={config}
          onChange={(c) => setConfig(normalizeStudioConfig(c))}
          onRandomize={handleRandomize}
          onResetPhysics={handleResetPhysics}
          disabled={generating}
        />

        <div className="space-y-4">
          <BouncingRingCanvas
            config={config}
            generating={generating}
            onGeneratingChange={setGenerating}
            onRecordingComplete={handleRecordingComplete}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {generating
                ? `Generating (${config.targetTime}s)…`
                : "Generate animation"}
            </button>
            <button
              type="button"
              disabled={!gifExport?.bytes.length || generating}
              onClick={handleDownloadClick}
              className="rounded-lg border border-zinc-600 px-6 py-3 font-medium hover:bg-zinc-800 disabled:opacity-40"
            >
              Download GIF
            </button>
          </div>

          {status && (
            <p className="text-sm text-zinc-400" aria-live="polite">
              {status}
            </p>
          )}
        </div>
      </div>

      <PayModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onUnlock={handleUnlock}
        loading={payLoading}
        error={payError}
      />
    </main>
  );
}
