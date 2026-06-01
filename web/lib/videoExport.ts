import JSZip from "jszip";
import { rgbToHex } from "./simulation/colors";
import type { Rgb } from "./simulation/types";

/**
 * Packages a list of PNG data URLs into a sequential ZIP archive.
 * Triggers compression progress reporting.
 */
export class PngSequenceExporter {
  private zip = new JSZip();
  private frameCount = 0;

  addFrame(dataUrl: string): void {
    // Extract base64 part of the data URL
    const base64Data = dataUrl.split(",")[1];
    if (!base64Data) return;

    const filename = `frame_${String(this.frameCount).padStart(5, "0")}.png`;
    this.zip.file(filename, base64Data, { base64: true });
    this.frameCount++;
  }

  addAudio(audioBlob: Blob): void {
    this.zip.file("soundtrack.wav", audioBlob);
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  async finish(
    onProgress?: (percent: number) => void
  ): Promise<Blob> {
    if (this.frameCount === 0) {
      throw new Error("No frames recorded");
    }

    return await this.zip.generateAsync({ type: "blob" }, (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    });
  }
}

/**
 * Helper to check if WebM recording with transparency is supported in the browser.
 */
export function isWebMTransparentSupported(): boolean {
  if (typeof window === "undefined" || !window.MediaRecorder) return false;
  
  // Checking VP9 which supports alpha channel recording
  return (
    MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ||
    MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
  );
}

/**
 * Records canvas stream directly to transparent WebM.
 */
export class WebMAlphaRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  constructor(canvas: HTMLCanvasElement, fps: number = 30, audioStream?: MediaStream) {
    if (typeof window === "undefined") return;

    // Check supported MIME type with high probability of alpha support
    let options = { mimeType: "video/webm;codecs=vp9" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm;codecs=vp8" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
    }

    try {
      // Capture the canvas stream at the desired frame rate
      this.stream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
      if (this.stream) {
        if (audioStream) {
          const audioTrack = audioStream.getAudioTracks()[0];
          if (audioTrack) {
            this.stream.addTrack(audioTrack);
          }
        }
        this.mediaRecorder = new MediaRecorder(this.stream, options);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.recordedChunks.push(e.data);
          }
        };
      }
    } catch (e) {
      console.error("Failed to initialize MediaRecorder:", e);
    }
  }

  start(): void {
    this.recordedChunks = [];
    if (this.mediaRecorder && this.mediaRecorder.state === "inactive") {
      this.mediaRecorder.start();
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        resolve(new Blob());
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "video/webm";
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        resolve(blob);
        
        // Stop stream tracks to release resource hooks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }
      };

      this.mediaRecorder.stop();
    });
  }
}

/**
 * Real-time high-fidelity uncompressed stereo WAV audio recorder.
 */
export class AudioWavRecorder {
  private context: AudioContext;
  private processor: ScriptProcessorNode | null = null;
  private buffers: Float32Array[][] = [[], []]; // Left and right channels
  private recording = false;

  constructor(context: AudioContext) {
    this.context = context;
  }

  getProcessorNode(): ScriptProcessorNode | null {
    return this.processor;
  }

  start(): void {
    this.buffers = [[], []];
    this.recording = true;

    const createProcessor = this.context.createScriptProcessor || (this.context as any).createJavaScriptNode;
    this.processor = createProcessor.call(this.context, 4096, 2, 2);

    this.processor.onaudioprocess = (e) => {
      if (!this.recording) return;
      const left = e.inputBuffer.getChannelData(0);
      const right = e.inputBuffer.getChannelData(1);
      
      this.buffers[0].push(new Float32Array(left));
      this.buffers[1].push(new Float32Array(right));
    };

    this.processor.connect(this.context.destination);
  }

  stop(): Blob {
    this.recording = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    const leftBuffer = mergeBuffers(this.buffers[0]);
    const rightBuffer = mergeBuffers(this.buffers[1]);

    const audioBuffer = new AudioBuffer({
      length: leftBuffer.length,
      numberOfChannels: 2,
      sampleRate: this.context.sampleRate,
    });

    audioBuffer.copyToChannel(leftBuffer as any, 0);
    audioBuffer.copyToChannel(rightBuffer as any, 1);

    return bufferToWav(audioBuffer);
  }
}

function mergeBuffers(channelBuffer: Float32Array[]): Float32Array {
  if (channelBuffer.length === 0) return new Float32Array(0);
  const totalLength = channelBuffer.reduce((acc, buf) => acc + buf.length, 0);
  const result = new Float32Array(totalLength);
  let offset = 0;
  for (const buf of channelBuffer) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels: Float32Array[] = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // chunk length
  setUint16(1);          // sample format (raw)
  setUint16(numOfChan);  // channel count
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16);         // bits per sample
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // chunk length

  for (i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length - 4) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArr], { type: "audio/wav" });
}

/**
 * Helper to download raw exported blobs.
 */
export function downloadBlob(
  blob: Blob,
  extension: string,
  ballRgb: Rgb
): void {
  const hex = rgbToHex(ballRgb);
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "_")
    .slice(0, 15);
  const filename = `satisfying_ring_${hex}_${stamp}.${extension}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
