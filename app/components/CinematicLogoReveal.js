"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles, Play } from "lucide-react";

export default function CinematicLogoReveal({ onComplete, autoPlay = true, fullScreenIntro = true }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [phaseText, setPhaseText] = useState("Igniting Core...");
  const [showReplay, setShowReplay] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let startTime = null;

    // Responsive Canvas dimensions
    function setCanvasDimensions() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);

    // Node definitions for Brain/Mindmap (Relative coordinates from center (0,0))
    // Outer Head Silhouette points (Bezier curve sequence)
    const headOutlinePoints = [
      { x: 0, y: 150 }, // Chin bottom
      { x: -40, y: 145 },
      { x: -80, y: 120 }, // Jaw
      { x: -110, y: 80 }, // Ear area
      { x: -115, y: 20 },
      { x: -125, y: -40 }, // Back of head lower
      { x: -120, y: -90 }, // Back head upper
      { x: -90, y: -140 }, // Top back head
      { x: -40, y: -165 }, // Top head center
      { x: 20, y: -165 }, // Forehead top
      { x: 70, y: -140 }, // Forehead slope
      { x: 105, y: -95 }, // Brow / Forehead bump
      { x: 80, y: -50 }, // Eye indentation
      { x: 115, y: -20 }, // Nose tip
      { x: 75, y: 15 }, // Upper lip / mouth
      { x: 85, y: 40 }, // Lips / Chin top
      { x: 60, y: 90 }, // Chin curve
      { x: 25, y: 135 }, // Lower chin
      { x: 0, y: 150 }, // Return to chin
    ];

    // Neural Branches radiating from central core (0, -10)
    const neuralBranches = [
      // Branch 1: Top Left Brain (Frontal/Parietal lobe)
      {
        path: [{ x: 0, y: -10 }, { x: -30, y: -50 }, { x: -65, y: -95 }, { x: -80, y: -130 }],
        color: "#8b5cf6", // Purple
        nodes: [{ x: -30, y: -50, r: 4 }, { x: -65, y: -95, r: 5 }, { x: -80, y: -130, r: 6 }],
      },
      // Branch 2: Mid-Top Left
      {
        path: [{ x: 0, y: -10 }, { x: -45, y: -30 }, { x: -85, y: -50 }, { x: -105, y: -70 }],
        color: "#a855f7", // Violet
        nodes: [{ x: -45, y: -30, r: 4 }, { x: -85, y: -50, r: 5 }, { x: -105, y: -70, r: 5 }],
      },
      // Branch 3: Lower Left (Occipital/Temporal)
      {
        path: [{ x: 0, y: -10 }, { x: -40, y: 15 }, { x: -75, y: 30 }, { x: -95, y: 10 }],
        color: "#ec4899", // Pink
        nodes: [{ x: -40, y: 15, r: 4 }, { x: -75, y: 30, r: 5 }, { x: -95, y: 10, r: 5 }],
      },
      // Branch 4: Top Right (Frontal Lobe)
      {
        path: [{ x: 0, y: -10 }, { x: 30, y: -50 }, { x: 60, y: -90 }, { x: 75, y: -125 }],
        color: "#f43f5e", // Rose Pink
        nodes: [{ x: 30, y: -50, r: 4 }, { x: 60, y: -90, r: 5 }, { x: 75, y: -125, r: 6 }],
      },
      // Branch 5: Mid-Right (Executive Cortex)
      {
        path: [{ x: 0, y: -10 }, { x: 45, y: -25 }, { x: 75, y: -45 }, { x: 90, y: -65 }],
        color: "#f97316", // Orange
        nodes: [{ x: 45, y: -25, r: 4 }, { x: 75, y: -45, r: 5 }, { x: 90, y: -65, r: 5 }],
      },
      // Branch 6: Lower Right (Perception)
      {
        path: [{ x: 0, y: -10 }, { x: 35, y: 20 }, { x: 65, y: 35 }, { x: 80, y: 60 }],
        color: "#eab308", // Gold
        nodes: [{ x: 35, y: 20, r: 4 }, { x: 65, y: 35, r: 5 }, { x: 80, y: 60, r: 6 }],
      },
      // Secondary Sub-branches for complexity
      {
        path: [{ x: -65, y: -95 }, { x: -40, y: -120 }, { x: -30, y: -145 }],
        color: "#c084fc",
        nodes: [{ x: -40, y: -120, r: 3.5 }, { x: -30, y: -145, r: 4.5 }],
        delayRatio: 0.4,
      },
      {
        path: [{ x: 60, y: -90 }, { x: 35, y: -120 }, { x: 20, y: -145 }],
        color: "#fb923c",
        nodes: [{ x: 35, y: -120, r: 3.5 }, { x: 20, y: -145, r: 4.5 }],
        delayRatio: 0.45,
      },
    ];

    // Background bokeh particles
    const bgParticles = Array.from({ length: 45 }, () => ({
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 500,
      r: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
      speedY: (Math.random() - 0.5) * 0.2,
      speedX: (Math.random() - 0.5) * 0.2,
      color: Math.random() > 0.5 ? "#8b5cf6" : "#f59e0b",
    }));

    // Helper: Interpolate smooth easing (Cubic Ease Out)
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
    }
    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Helper: Get point along multi-segment polyline path at progress (0..1)
    function getPointOnPath(points, progress) {
      if (points.length < 2) return points[0];
      const totalSegments = points.length - 1;
      const scaled = progress * totalSegments;
      const segIndex = Math.min(Math.floor(scaled), totalSegments - 1);
      const segT = scaled - segIndex;

      const p1 = points[segIndex];
      const p2 = points[segIndex + 1];
      return {
        x: p1.x + (p2.x - p1.x) * segT,
        y: p1.y + (p2.y - p1.y) * segT,
      };
    }

    // Render Animation Loop
    function render(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // in seconds

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const cy = height / 2 - 10; // Slightly centered

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Background Ambient Parallax Glow
      const ambientGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 280);
      ambientGlow.addColorStop(0, "rgba(139, 92, 246, 0.12)");
      ambientGlow.addColorStop(0.5, "rgba(236, 72, 153, 0.05)");
      ambientGlow.addColorStop(1, "rgba(9, 9, 11, 0)");
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw Background Floating Bokeh Particles
      bgParticles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        if (Math.abs(p.y) > 300) p.speedY *= -1;
        if (Math.abs(p.x) > 300) p.speedX *= -1;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(elapsed * 2 + p.x));
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      });

      /* ─────────────────────────────────────────────────────────────
         STAGE 0: Core Spark Ignition (0.0s - 0.8s)
         ───────────────────────────────────────────────────────────── */
      const sparkProgress = easeOutCubic(elapsed / 0.8);
      if (elapsed > 0) {
        ctx.save();
        const coreGlow = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy - 10, 45 * sparkProgress);
        coreGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        coreGlow.addColorStop(0.3, "rgba(234, 179, 8, 0.8)");
        coreGlow.addColorStop(0.7, "rgba(139, 92, 246, 0.4)");
        coreGlow.addColorStop(1, "rgba(139, 92, 246, 0)");

        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 50 * sparkProgress, 0, Math.PI * 2);
        ctx.fill();

        // Central Spark Diamond Flare
        if (elapsed < 1.2) {
          const flareSize = Math.sin(Math.min(1, elapsed / 0.8) * Math.PI) * 20;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - flareSize, cy - 10);
          ctx.lineTo(cx + flareSize, cy - 10);
          ctx.moveTo(cx, cy - 10 - flareSize);
          ctx.lineTo(cx, cy - 10 + flareSize);
          ctx.shadowColor = "#eab308";
          ctx.shadowBlur = 15;
          ctx.stroke();
        }
        ctx.restore();
      }

      /* ─────────────────────────────────────────────────────────────
         STAGE 1: Neural Branch Light Trails Spreading (0.6s - 2.4s)
         ───────────────────────────────────────────────────────────── */
      const branchStartTime = 0.6;
      const branchDuration = 1.8;
      const branchGlobalProgress = easeOutCubic((elapsed - branchStartTime) / branchDuration);

      if (elapsed > branchStartTime) {
        neuralBranches.forEach((b) => {
          const delayRatio = b.delayRatio || 0;
          const localProgress = Math.max(
            0,
            Math.min(1, (branchGlobalProgress - delayRatio) / (1 - delayRatio))
          );
          if (localProgress <= 0) return;

          const easedLocal = easeOutCubic(localProgress);

          // Draw Glowing Branch Line
          ctx.save();
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          // Gradient along path
          const grad = ctx.createLinearGradient(
            cx + b.path[0].x,
            cy + b.path[0].y,
            cx + b.path[b.path.length - 1].x,
            cy + b.path[b.path.length - 1].y
          );
          grad.addColorStop(0, "#8b5cf6"); // Purple
          grad.addColorStop(0.4, "#ec4899"); // Pink
          grad.addColorStop(0.7, "#f97316"); // Orange
          grad.addColorStop(1, "#eab308"); // Gold

          ctx.strokeStyle = grad;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 12;

          ctx.beginPath();
          const totalPointsToDraw = Math.ceil(easedLocal * (b.path.length - 1));
          ctx.moveTo(cx + b.path[0].x, cy + b.path[0].y);

          for (let i = 1; i <= totalPointsToDraw; i++) {
            if (i === totalPointsToDraw) {
              const currentTip = getPointOnPath(b.path, easedLocal);
              ctx.lineTo(cx + currentTip.x, cy + currentTip.y);
            } else {
              ctx.lineTo(cx + b.path[i].x, cy + b.path[i].y);
            }
          }
          ctx.stroke();

          // Draw Glowing Spark Tip on front edge of spreading ink line
          const tip = getPointOnPath(b.path, easedLocal);
          if (localProgress < 1) {
            ctx.beginPath();
            ctx.arc(cx + tip.x, cy + tip.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#eab308";
            ctx.shadowBlur = 16;
            ctx.fill();
          }

          // Ignite Nodes as the branch reaches them
          b.nodes.forEach((n) => {
            // Distance check to tip to determine if ignited
            const dx = n.x - b.path[0].x;
            const dy = n.y - b.path[0].y;
            const distNode = Math.sqrt(dx * dx + dy * dy);

            const tipDx = tip.x - b.path[0].x;
            const tipDy = tip.y - b.path[0].y;
            const distTip = Math.sqrt(tipDx * tipDx + tipDy * tipDy);

            if (distTip >= distNode * 0.85) {
              const nodeGlowScale = Math.min(1, (distTip - distNode * 0.85) / 15);
              ctx.beginPath();
              ctx.arc(cx + n.x, cy + n.y, n.r * (0.8 + 0.2 * Math.sin(elapsed * 3)), 0, Math.PI * 2);
              ctx.fillStyle = b.color;
              ctx.shadowColor = b.color;
              ctx.shadowBlur = 14 * nodeGlowScale;
              ctx.fill();

              // Inner bright core of node
              ctx.beginPath();
              ctx.arc(cx + n.x, cy + n.y, n.r * 0.45, 0, Math.PI * 2);
              ctx.fillStyle = "#ffffff";
              ctx.fill();
            }
          });

          ctx.restore();
        });
      }

      /* ─────────────────────────────────────────────────────────────
         STAGE 2: Central "?" Question Mark Ignition (1.4s - 2.8s)
         ───────────────────────────────────────────────────────────── */
      if (elapsed > 1.2) {
        const qProgress = easeOutCubic((elapsed - 1.2) / 1.2);
        ctx.save();
        ctx.font = "bold 44px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const qGrad = ctx.createLinearGradient(cx - 20, cy - 35, cx + 20, cy + 15);
        qGrad.addColorStop(0, "#c4b5fd");
        qGrad.addColorStop(0.5, "#ec4899");
        qGrad.addColorStop(1, "#fde047");

        ctx.fillStyle = qGrad;
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 18 * qProgress;
        ctx.globalAlpha = qProgress;
        ctx.fillText("?", cx, cy - 10);
        ctx.restore();
      }

      /* ─────────────────────────────────────────────────────────────
         STAGE 3: Continuous Head Silhouette Outline Pen-of-Light (2.2s - 3.6s)
         ───────────────────────────────────────────────────────────── */
      const outlineStartTime = 2.0;
      const outlineDuration = 1.6;
      const outlineProgress = easeOutCubic((elapsed - outlineStartTime) / outlineDuration);

      if (elapsed > outlineStartTime) {
        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const headGrad = ctx.createLinearGradient(cx - 100, cy, cx + 100, cy);
        headGrad.addColorStop(0, "rgba(139, 92, 246, 0.9)");
        headGrad.addColorStop(0.5, "rgba(236, 72, 153, 0.9)");
        headGrad.addColorStop(1, "rgba(245, 158, 11, 0.9)");

        ctx.strokeStyle = headGrad;
        ctx.shadowColor = "#8b5cf6";
        ctx.shadowBlur = 14;

        ctx.beginPath();
        const maxIdx = Math.ceil(outlineProgress * (headOutlinePoints.length - 1));
        ctx.moveTo(cx + headOutlinePoints[0].x, cy + headOutlinePoints[0].y);

        for (let i = 1; i <= maxIdx; i++) {
          if (i === maxIdx) {
            const currentTip = getPointOnPath(headOutlinePoints, outlineProgress);
            ctx.lineTo(cx + currentTip.x, cy + currentTip.y);
          } else {
            ctx.lineTo(cx + headOutlinePoints[i].x, cy + headOutlinePoints[i].y);
          }
        }
        ctx.stroke();

        // Pen of Light Spark at current tip of head outline
        if (outlineProgress < 0.99) {
          const penTip = getPointOnPath(headOutlinePoints, outlineProgress);
          ctx.beginPath();
          ctx.arc(cx + penTip.x, cy + penTip.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 18;
          ctx.fill();
        }

        ctx.restore();
      }

      /* ─────────────────────────────────────────────────────────────
         STAGE 4: Metallic Light Sweep Reflection Bloom (3.6s - 4.2s)
         ───────────────────────────────────────────────────────────── */
      const sweepStartTime = 3.6;
      const sweepDuration = 0.7;
      if (elapsed > sweepStartTime && elapsed < sweepStartTime + sweepDuration) {
        const sweepProgress = (elapsed - sweepStartTime) / sweepDuration;
        const sweepX = cx - 220 + sweepProgress * 440;

        ctx.save();
        const sweepGrad = ctx.createLinearGradient(sweepX - 40, cy - 100, sweepX + 40, cy + 100);
        sweepGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        sweepGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.55)");
        sweepGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.ellipse(sweepX, cy, 35, 170, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* ─────────────────────────────────────────────────────────────
         STAGE 5: Breathing Glow Loop & Idle Animation (4.0s+)
         ───────────────────────────────────────────────────────────── */
      if (elapsed > 3.8) {
        if (phaseText !== "Cognitive Map Active") setPhaseText("Cognitive Map Active");
        if (!showReplay) setShowReplay(true);
        if (onComplete && elapsed > 4.5) onComplete();
      } else if (elapsed > 2.0) {
        setPhaseText("Tracing Neural Profile...");
      } else if (elapsed > 0.8) {
        setPhaseText("Spreading Neural Light...");
      }

      // Loop animation frame
      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", setCanvasDimensions);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        width: "100%",
        height: fullScreenIntro ? "100vh" : "380px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#09090b",
        position: "relative",
        overflow: "hidden",
        borderRadius: fullScreenIntro ? "0" : "20px",
        border: fullScreenIntro ? "none" : "1px solid rgba(139, 92, 246, 0.2)",
        boxShadow: fullScreenIntro ? "none" : "0 20px 50px rgba(0, 0, 0, 0.6)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* Cinematic Phase Label overlay */}
      <div
        style={{
          position: "absolute",
          bottom: fullScreenIntro ? "60px" : "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(18, 18, 22, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          padding: "8px 20px",
          borderRadius: "30px",
          color: "#c4b5fd",
          fontSize: "13px",
          fontWeight: "600",
          letterSpacing: "0.05em",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          transition: "all 0.3s ease",
        }}
      >
        <Sparkles size={14} className="text-amber-400" />
        <span>{phaseText}</span>
      </div>
    </div>
  );
}
