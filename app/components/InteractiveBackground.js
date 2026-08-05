"use client";

import { useEffect, useRef } from "react";

export default function InteractiveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const handleResize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Mouse tracking
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      active: true,
      radius: 220,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Generate network particles
    const particleCount = Math.max(65, Math.floor((width * height) / 11000));
    const particles = [];

    const colorPalette = [
      { r: 59, g: 130, b: 246 },   // Electric Blue
      { r: 99, g: 102, b: 241 },   // Indigo
      { r: 168, g: 85, b: 247 },   // Cyber Purple
      { r: 34, g: 197, b: 94 },    // Neon Emerald
      { r: 245, g: 158, b: 11 },   // Amber Gold
      { r: 6, g: 182, b: 212 },    // Cyan
    ];

    for (let i = 0; i < particleCount; i++) {
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2.5 + 1.5,
        color: color,
        baseAlpha: Math.random() * 0.4 + 0.4,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulseAngle: Math.random() * Math.PI * 2,
      });
    }

    // Ambient floating glow orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.25, radius: 350, color: "rgba(59, 130, 246, 0.14)", vx: 0.2, vy: 0.15 },
      { x: width * 0.8, y: height * 0.75, radius: 400, color: "rgba(168, 85, 247, 0.12)", vx: -0.15, vy: -0.2 },
      { x: width * 0.5, y: height * 0.5, radius: 300, color: "rgba(6, 182, 212, 0.1)", vx: 0.1, vy: -0.1 },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse position interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      // 1. Draw ambient background glowing orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < -150 || orb.x > width + 150) orb.vx *= -1;
        if (orb.y < -150 || orb.y > height + 150) orb.vy *= -1;

        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, "rgba(9, 9, 11, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw interactive mouse aura glow
      if (mouse.active) {
        const mouseGradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius
        );
        mouseGradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
        mouseGradient.addColorStop(0.4, "rgba(99, 102, 241, 0.1)");
        mouseGradient.addColorStop(1, "rgba(9, 9, 11, 0)");

        ctx.fillStyle = mouseGradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Update & Draw Particles & Connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Position update
        p.x += p.vx;
        p.y += p.vy;

        // Bounce boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Pulse alpha
        p.pulseAngle += p.pulseSpeed;
        const currentAlpha = Math.min(1, Math.max(0.2, p.baseAlpha + Math.sin(p.pulseAngle) * 0.25));

        // Interactivity with mouse cursor
        let mouseDist = 999;
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          mouseDist = Math.sqrt(dx * dx + dy * dy);

          if (mouseDist < mouse.radius) {
            // Draw neon synapse line connecting to cursor
            const lineAlpha = (1 - mouseDist / mouse.radius) * 0.7;
            ctx.strokeStyle = `rgba(59, 130, 246, ${lineAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();

            // Push particle away slightly from cursor
            const force = (1 - mouseDist / mouse.radius) * 0.8;
            p.x -= (dx / Math.max(1, mouseDist)) * force;
            p.y -= (dy / Math.max(1, mouseDist)) * force;
          }
        }

        // Draw inter-particle constellation links
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 140;

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.35;
            const avgR = Math.round((p.color.r + p2.color.r) / 2);
            const avgG = Math.round((p.color.g + p2.color.g) / 2);
            const avgB = Math.round((p.color.b + p2.color.b) / 2);
            ctx.strokeStyle = `rgba(${avgR}, ${avgG}, ${avgB}, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw glowing particle node
        const { r, g, b } = p.color;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.shadowBlur = mouseDist < mouse.radius ? 12 : 6;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (mouseDist < mouse.radius ? 1.4 : 1), 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
