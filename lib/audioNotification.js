/**
 * Synthesizes and plays a smooth, premium notification chime via Web Audio API
 * when an AI scenario evaluation or decision mapping completes.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playAiEvaluationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic chime: E5 (659.25Hz) -> A5 (880.00Hz) -> D6 (1174.66Hz)
    // A lush, subtle ascending glass chime for AI completion
    const notes = [
      { freq: 659.25, time: 0.00, duration: 0.35, gain: 0.12 },
      { freq: 880.00, time: 0.07, duration: 0.50, gain: 0.15 },
      { freq: 1174.66, time: 0.14, duration: 0.65, gain: 0.10 },
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const startTime = now + time;
      const stopTime = startTime + duration;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack ramp to prevent pop/click
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.015);
      // Exponential decay release
      gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(stopTime);
    });
  } catch (err) {
    console.debug("[Audio Notification] Playback silenced:", err);
  }
}

