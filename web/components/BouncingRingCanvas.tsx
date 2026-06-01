"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Simulation, FRAME_SKIP, WIDTH, HEIGHT } from "@/lib/simulation/Simulation";
import { GifStreamEncoder, type GifExportResult } from "@/lib/gifExport";
import type { StudioConfig } from "@/lib/simulation/types";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function resumeAudioCtx(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
}

function playBounceNote(config: StudioConfig, bounceCount: number, speed: number) {
  if (!config.soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  // Create oscillator, envelope, and lowpass filter
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  let frequency = 440;
  
  if (config.soundPalette === "pentatonic") {
    // Satisfying pentatonic climb
    const pentatonicScale = [
      130.81, 146.83, 164.81, 196.00, 220.00, // Octave 3 (C3 - A3)
      261.63, 293.66, 329.63, 392.00, 440.00, // Octave 4 (C4 - A4)
      523.25, 587.33, 659.25, 783.99, 880.00, // Octave 5 (C5 - A5)
      1046.50, 1174.66, 1318.51, 1567.98, 1760.00 // Octave 6 (C6 - A6)
    ];
    const noteIndex = (bounceCount - 1) % pentatonicScale.length;
    frequency = pentatonicScale[noteIndex];
  } else if (config.soundPalette === "escalating") {
    // Continuously scaling frequency based on speed
    const baseFreq = 130.81; // C3
    frequency = baseFreq * (1 + (speed - 14) / 25);
    frequency = Math.min(2500, Math.max(130.81, frequency));
  } else if (config.soundPalette === "chime") {
    // Minor triad arpeggio arpeggiating upward
    const root = 220.00; // A3
    const ratios = [1, 1.2, 1.5, 2, 2.4, 3, 4];
    const index = (bounceCount - 1) % ratios.length;
    frequency = root * ratios[index];
  } else if (config.soundPalette === "marimba") {
    // Warm woody pentatonic
    const scale = [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33, 659.25, 783.99]; // G3 - G5
    const index = (bounceCount - 1) % scale.length;
    frequency = scale[index];
  }

  const now = ctx.currentTime;

  // Sound synthesis styling per palette
  if (config.soundPalette === "marimba") {
    osc.type = "sine";
    // Brief wood overtone (3rd harmonic)
    const overtone = ctx.createOscillator();
    const overtoneGain = ctx.createGain();
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(frequency * 3.0, now);
    overtone.connect(overtoneGain);
    overtoneGain.connect(filter);
    
    overtoneGain.gain.setValueAtTime(0.08, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    overtone.start(now);
    overtone.stop(now + 0.15);
  } else if (config.soundPalette === "chime") {
    osc.type = "triangle";
    // Bright metallic overtone
    const metal = ctx.createOscillator();
    const metalGain = ctx.createGain();
    metal.type = "sine";
    metal.frequency.setValueAtTime(frequency * 4.2, now);
    metal.connect(metalGain);
    metalGain.connect(filter);
    
    metalGain.gain.setValueAtTime(0.12, now);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    metal.start(now);
    metal.stop(now + 0.5);
  } else {
    // Standard pluck (tri + sine mix)
    osc.type = "sine";
    const bite = ctx.createOscillator();
    const biteGain = ctx.createGain();
    bite.type = "triangle";
    bite.frequency.setValueAtTime(frequency, now);
    bite.connect(biteGain);
    biteGain.connect(filter);
    
    biteGain.gain.setValueAtTime(0.05, now);
    biteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    bite.start(now);
    bite.stop(now + 0.08);
  }

  osc.frequency.setValueAtTime(frequency, now);

  // Lowpass pluck filter sweep
  filter.type = "lowpass";
  if (config.soundPalette === "chime") {
    filter.Q.setValueAtTime(4, now);
    filter.frequency.setValueAtTime(frequency * 5, now);
    filter.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.4);
  } else if (config.soundPalette === "marimba") {
    filter.Q.setValueAtTime(1, now);
    filter.frequency.setValueAtTime(frequency * 2.5, now);
    filter.frequency.exponentialRampToValueAtTime(frequency * 1.0, now + 0.1);
  } else {
    filter.Q.setValueAtTime(2, now);
    filter.frequency.setValueAtTime(frequency * 4, now);
    filter.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + 0.25);
  }

  // Pluck amplitude envelope
  const decayTime = config.soundPalette === "marimba" ? 0.2 : (config.soundPalette === "chime" ? 0.6 : 0.45);
  gainNode.gain.setValueAtTime(0.35, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

  osc.start(now);
  osc.stop(now + decayTime + 0.05);
}

type Props = {
  config: StudioConfig;
  generating: boolean;
  onGeneratingChange: (v: boolean) => void;
  onRecordingComplete: (result: GifExportResult) => void;
};

export function BouncingRingCanvas({
  config,
  generating,
  onGeneratingChange,
  onRecordingComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Simulation | null>(null);
  const frameCounterRef = useRef(0);
  const gifEncoderRef = useRef<GifStreamEncoder | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [previewing, setPreviewing] = useState(true);

  const finishRecording = useCallback(
    (sim: Simulation) => {
      if (!sim.recording) return;
      sim.stopRecording();
      onGeneratingChange(false);
      const encoder = gifEncoderRef.current;
      gifEncoderRef.current = null;
      frameCounterRef.current = 0;
      if (encoder) {
        try {
          onRecordingComplete(encoder.finish());
        } catch {
          onGeneratingChange(false);
        }
      }
    },
    [onGeneratingChange, onRecordingComplete],
  );

  useEffect(() => {
    const sim = new Simulation(config);
    sim.onBounceCallback = (bounceCount, speed) => {
      playBounceNote(config, bounceCount, speed);
    };
    simRef.current = sim;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    if (sim) {
      sim.updateConfig(config);
      sim.onBounceCallback = (bounceCount, speed) => {
        playBounceNote(config, bounceCount, speed);
      };
    }
  }, [config]);

  const loop = useCallback(
    (time: number) => {
      const sim = simRef.current;
      const canvas = canvasRef.current;
      if (!sim || !canvas) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      const wasComplete = sim.isComplete;

      if ((previewing || generating) && sim.shouldAnimate()) {
        sim.tick(time, dt);
      }

      if (generating && sim.recording) {
        frameCounterRef.current += 1;
        if (frameCounterRef.current % FRAME_SKIP === 0) {
          gifEncoderRef.current?.addFrame(sim.captureTransparentFrame());
        }

        if (sim.isRecordingComplete()) {
          if (frameCounterRef.current % FRAME_SKIP !== 0) {
            gifEncoderRef.current?.addFrame(sim.captureTransparentFrame());
          }
          finishRecording(sim);
        }
      }

      sim.draw(ctx);

      // Freeze when simulation is complete and all chimes and confetti animations have finished
      if (sim.isComplete && !generating && !sim.shouldAnimate()) {
        return;
      }

      if (sim.shouldAnimate() || generating) {
        rafRef.current = requestAnimationFrame(loop);
      }
    },
    [config, generating, finishRecording, previewing],
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  useEffect(() => {
    if (!generating) return;
    const sim = simRef.current;
    if (!sim) return;
    gifEncoderRef.current = new GifStreamEncoder();
    frameCounterRef.current = 0;
    lastTimeRef.current = 0;
    sim.startRecording();
    rafRef.current = requestAnimationFrame(loop);
  }, [generating, loop]);

  const handleReset = () => {
    const sim = simRef.current;
    if (!sim) return;
    sim.resetState();
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={resumeAudioCtx}
        className="max-w-full h-auto rounded-xl border border-zinc-700 shadow-2xl cursor-pointer"
        style={{ width: "min(100%, 800px)", aspectRatio: "1" }}
        title="Click to enable sound"
      />
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            resumeAudioCtx();
            handleReset();
          }}
          className="rounded-lg border border-zinc-600 px-4 py-2 hover:bg-zinc-800"
        >
          Reset preview
        </button>
        <button
          type="button"
          onClick={() => {
            resumeAudioCtx();
            setPreviewing((p) => !p);
            if (simRef.current?.isComplete) {
              rafRef.current = requestAnimationFrame(loop);
            }
          }}
          className="rounded-lg border border-zinc-600 px-4 py-2 hover:bg-zinc-800"
        >
          {previewing ? "Pause" : "Resume"} preview
        </button>
      </div>
    </div>
  );
}
